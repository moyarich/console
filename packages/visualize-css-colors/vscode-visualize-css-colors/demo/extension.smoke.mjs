import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";
import { chromium } from "playwright-core";
import { hideDemoCaption, showDemoCaption } from "./demo-caption.mjs";
import {
  installDemoMagnifierCursorOverlay,
  pointDemoMagnifierCursorAt,
  removeDemoMagnifierCursorOverlay,
} from "./demo-magnifier-cursor-overlay.mjs";
import { captureScenario } from "./inspector.mjs";
import { scenarios, selectScenarios } from "./scenarios/index.mjs";

const codegen = process.argv.includes("--codegen");
const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectDirectory,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}
async function waitForVSCodeDevTools({ remoteDebuggingPort }) {
  const endpoint = `http://127.0.0.1:${remoteDebuggingPort}`;

  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/version`);

      if (response.ok) {
        return endpoint;
      }
    } catch {
      // VS Code is still starting.
    }

    await pause(250);
  }

  throw new Error("Timed out waiting for the VS Code demo window.");
}

async function findVSCodeWorkbenchPage(browser) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    const pages = browser.contexts().flatMap((context) => context.pages());

    const workbench = pages.find((page) => page.url().includes("workbench"));

    if (workbench) {
      await workbench.locator(".monaco-workbench").waitFor({
        timeout: 30_000,
      });

      return workbench;
    }

    await pause(250);
  }

  throw new Error("VS Code opened, but the workbench page was not found.");
}

function createFrameRecorder({ page, framesDirectory, frameRate }) {
  let running = false;
  let frameNumber = 0;
  let session;
  let startedAt = 0;
  let lastFrameData;
  let writeQueue = Promise.resolve();
  let resolveFirstFrame;
  const firstFrame = new Promise((resolve) => {
    resolveFirstFrame = resolve;
  });

  function enqueueFrames(data, targetFrameCount) {
    while (frameNumber < targetFrameCount) {
      const fileName = `${String(frameNumber).padStart(6, "0")}.png`;
      writeQueue = writeQueue.then(() =>
        writeFile(path.join(framesDirectory, fileName), data, "base64"),
      );
      frameNumber += 1;
    }
  }

  return {
    async start() {
      if (running) {
        throw new Error("Frame recorder is already running.");
      }

      running = true;
      startedAt = 0;
      session = await page.context().newCDPSession(page);
      session.on("Page.screencastFrame", ({ data, sessionId }) => {
        void session
          ?.send("Page.screencastFrameAck", { sessionId })
          .catch(() => undefined);
        if (!running) {
          return;
        }

        if (startedAt === 0) {
          startedAt = Date.now();
        }
        lastFrameData = data;
        const elapsed = Date.now() - startedAt;
        const targetFrameCount = Math.max(
          1,
          Math.floor((elapsed * frameRate) / 1000) + 1,
        );
        enqueueFrames(data, targetFrameCount);
        resolveFirstFrame?.();
        resolveFirstFrame = undefined;
      });
      await session.send("Page.startScreencast", {
        format: "png",
        everyNthFrame: 1,
        maxWidth: 1280,
        maxHeight: 900,
      });
      await Promise.race([
        firstFrame,
        pause(5_000).then(() => {
          throw new Error("Timed out waiting for the first screencast frame.");
        }),
      ]);
    },

    async stop() {
      if (!session) {
        return;
      }

      running = false;
      const elapsed = startedAt === 0 ? 0 : Date.now() - startedAt;
      if (lastFrameData) {
        enqueueFrames(
          lastFrameData,
          Math.max(1, Math.ceil((elapsed * frameRate) / 1000)),
        );
      }
      await session.send("Page.stopScreencast").catch(() => undefined);
      await writeQueue;
      await session.detach().catch(() => undefined);
      session = undefined;
    },

    get frameCount() {
      return frameNumber;
    },
  };
}

async function encodeRecording({ framesDirectory, recordingPath, frameRate }) {
  await runProcess("ffmpeg", [
    "-y",

    "-framerate",
    String(frameRate),

    "-i",
    path.join(framesDirectory, "%06d.png"),

    "-c:v",
    "libvpx-vp9",

    "-pix_fmt",
    "yuv420p",

    "-crf",
    "30",

    "-b:v",
    "0",

    recordingPath,
  ]);
}

async function recordScenario(name, scenario, vscodeExecutablePath) {
  const temporaryDirectory = await mkdtemp(
    path.join(
      process.platform === "darwin" ? "/tmp" : os.tmpdir(),
      "css-demo-",
    ),
  );
  const workspaceDirectory = path.join(temporaryDirectory, "workspace");
  const userDataDirectory = path.join(temporaryDirectory, "user");
  const completionFile = path.join(temporaryDirectory, "done");
  const outputDirectory = path.join(projectDirectory, "demo/artifacts", name);
  const framesDirectory = path.join(outputDirectory, "frames");
  const remoteDebuggingPort = await freePort();
  let browser;
  let recorder;
  let testRun;
  try {
    await mkdir(workspaceDirectory, { recursive: true });
    await mkdir(path.join(userDataDirectory, "User"), { recursive: true });
    await mkdir(path.join(temporaryDirectory, "extensions"), {
      recursive: true,
    });
    if (!codegen) await rm(framesDirectory, { recursive: true, force: true });
    await mkdir(framesDirectory, { recursive: true });
    await writeFile(
      path.join(userDataDirectory, "User/settings.json"),
      JSON.stringify({
        "workbench.colorTheme": "Default Dark Modern",
        "workbench.startupEditor": "none",
        "editor.colorDecorators": true,
        "editor.defaultColorDecorators": "never",
        "editor.minimap.enabled": false,
        "editor.fontSize": 18,
        "window.restoreWindows": "none",
        "workbench.editor.enablePreview": false,
        "telemetry.telemetryLevel": "off",
        "chat.disableAIFeatures": true,
      }),
    );
    const sourceFile = path.join(workspaceDirectory, scenario.fileName);
    await writeFile(sourceFile, scenario.source);
    testRun = runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath: path.join(
        projectDirectory,
        "dist/vscode-extension",
      ),
      extensionTestsPath: path.join(
        projectDirectory,
        "demo/extension-tests-runner.cjs",
      ),
      extensionTestsEnv: {
        EXTENSION_DEMO_COMPLETION_FILE: completionFile,
        EXTENSION_DEMO_SOURCE_FILE: sourceFile,
        EXTENSION_DEMO_CODEGEN: codegen ? "1" : "0",
      },
      launchArgs: [
        workspaceDirectory,
        sourceFile,
        `--user-data-dir=${userDataDirectory}`,
        `--extensions-dir=${path.join(temporaryDirectory, "extensions")}`,
        `--remote-debugging-port=${remoteDebuggingPort}`,
        "--disable-extension=vscode.css-language-features",
        "--new-window",
        "--skip-welcome",
        "--skip-release-notes",
      ],
    });
    // Attach a rejection handler immediately while the workbench starts.
    let hostFailure;
    testRun.catch((error) => {
      hostFailure = error;
    });
    const endpoint = await waitForVSCodeDevTools({ remoteDebuggingPort });
    if (hostFailure) throw hostFailure;
    browser = await chromium.connectOverCDP(endpoint);
    const page = await findVSCodeWorkbenchPage(browser);
    await page.bringToFront();
    await page.setViewportSize({ width: 1280, height: 900 });
    const swatch = page.locator(".colorpicker-color-decoration").first();
    await swatch.waitFor({ state: "visible", timeout: 30000 });
    if (codegen) {
      await captureScenario({ page, name, projectDirectory });
      return;
    }
    recorder = createFrameRecorder({ page, framesDirectory, frameRate: 10 });
    await recorder.start();
    await showDemoCaption({
      page,
      caption: {
        title: scenario.title,
        description: scenario.description,
        placement: "top-right",
      },
    });
    await pause(2500);
    await hideDemoCaption({ page });
    await installDemoMagnifierCursorOverlay({ page });
    await pointDemoMagnifierCursorAt({ page, locator: swatch });
    await swatch.hover();
    await page
      .locator(".colorpicker-widget")
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
    await page
      .locator("demo-magnifier-cursor-overlay .cursor.visible")
      .waitFor({ state: "visible" });
    await pause(500);
    await page.screenshot({
      path: path.join(outputDirectory, `${name}-magnifier.png`),
    });
    await pause(2200);
    await page.keyboard.press("Escape");
    await removeDemoMagnifierCursorOverlay({ page });
    await pause(1000);
    await page.screenshot({ path: path.join(outputDirectory, `${name}.png`) });
    await recorder.stop();
    await encodeRecording({
      framesDirectory,
      recordingPath: path.join(outputDirectory, `${name}.webm`),
      frameRate: 10,
    });
    await writeFile(completionFile, "done");
    await testRun;
    console.log(`Recorded ${name}: ${outputDirectory}`);
  } finally {
    await recorder?.stop().catch(() => undefined);
    await writeFile(completionFile, "done").catch(() => undefined);
    await testRun?.catch(() => undefined);
    await browser?.close().catch(() => undefined);
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

const selection =
  process.argv
    .find((argument) => argument.startsWith("--scenario="))
    ?.slice("--scenario=".length) ?? (codegen ? "color-mix" : "all");
const selected = selectScenarios(selection);
if (process.argv.includes("--list")) {
  for (const [name, scenario] of Object.entries(scenarios))
    console.log(`${name}: ${scenario.title}`);
} else {
  if (!process.argv.includes("--demo") && !codegen)
    throw new Error(
      "Use --demo to record video, --codegen to capture actions, or --list to list scenarios.",
    );
  // Check ffmpeg before downloading or opening an editor.
  if (!codegen) await runProcess("ffmpeg", ["-version"]);
  await readFile(
    path.join(projectDirectory, "dist/vscode-extension/package.json"),
  );
  const executable = await downloadAndUnzipVSCode({
    version: process.env.VSCODE_VERSION ?? "stable",
    cachePath: path.join(projectDirectory, ".vscode-test"),
  });
  for (const name of selected)
    await recordScenario(name, scenarios[name], executable);
}
