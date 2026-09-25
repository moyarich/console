import { spawn } from "node:child_process";
import {
  access,
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";
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

export const projectDirectory = fileURLToPath(new URL("../", import.meta.url));

export const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function isDirectScenario(moduleUrl) {
  return Boolean(
    process.argv[1] &&
      path.resolve(process.argv[1]) === path.resolve(fileURLToPath(moduleUrl)),
  );
}

export function runProcess(
  command,
  args,
  { cwd = projectDirectory, stdio = "inherit", ...options } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio,
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}

async function ensureBuiltExtension() {
  const packageFile = path.join(
    projectDirectory,
    "dist/vscode-extension/package.json",
  );

  try {
    await access(packageFile);
  } catch {
    await runProcess("npm", ["run", "build"]);
    await access(packageFile);
  }
}

export async function prepareScenarioRuntime({ codegen = false } = {}) {
  await ensureBuiltExtension();

  if (!codegen) {
    await runProcess("ffmpeg", ["-version"]);
  }

  return downloadAndUnzipVSCode({
    version: process.env.VSCODE_VERSION ?? "stable",
    cachePath: path.join(projectDirectory, ".vscode-test"),
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

export async function runScenario({
  name,
  scenario,
  vscodeExecutablePath,
  codegen = false,
}) {
  if (!scenario?.fileName || typeof scenario.source !== "string") {
    throw new Error(`Scenario "${name}" must define fileName and source.`);
  }

  if (!codegen && typeof scenario.run !== "function") {
    throw new Error(`Scenario "${name}" must define run({ page, ...helpers }).`);
  }

  const executable =
    vscodeExecutablePath ?? (await prepareScenarioRuntime({ codegen }));

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

    if (!codegen) {
      await rm(framesDirectory, { recursive: true, force: true });
    }

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
      vscodeExecutablePath: executable,
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

    let hostFailure;
    testRun.catch((error) => {
      hostFailure = error;
    });

    const endpoint = await waitForVSCodeDevTools({ remoteDebuggingPort });

    if (hostFailure) {
      throw hostFailure;
    }

    browser = await chromium.connectOverCDP(endpoint);
    const page = await findVSCodeWorkbenchPage(browser);

    await page.bringToFront();
    await page.setViewportSize({ width: 1280, height: 900 });

    await page
      .locator(".colorpicker-color-decoration")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });

    if (codegen) {
      await captureScenario({
        page,
        name,
        baseScenarioName: scenario.baseScenarioName ?? scenario.name ?? name,
        projectDirectory,
      });
      return;
    }

    recorder = createFrameRecorder({
      page,
      framesDirectory,
      frameRate: 10,
    });

    await recorder.start();

    await scenario.run({
      page,
      browser,
      name,
      workspaceDirectory,
      temporaryDirectory,
      outputDirectory,
      projectDirectory,
      pause,
      showDemoCaption,
      hideDemoCaption,
      installDemoMagnifierCursorOverlay,
      pointDemoMagnifierCursorAt,
      removeDemoMagnifierCursorOverlay,
    });

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

export async function runScenarioModule({ moduleUrl, name, scenario }) {
  if (!isDirectScenario(moduleUrl)) {
    return;
  }

  const codegen = process.argv.includes("--codegen");
  const executable = await prepareScenarioRuntime({ codegen });

  await runScenario({
    name,
    scenario,
    vscodeExecutablePath: executable,
    codegen,
  });
}
