import { spawn } from "node:child_process";
import {
  access,
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";
import { chromium } from "playwright-core";

export const projectDirectory = fileURLToPath(
  new URL("../../", import.meta.url),
);

export const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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

export async function prepareVSCodeRuntime() {
  await ensureBuiltExtension();

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

export async function createVSCodeRuntime({
  scenario,
  vscodeExecutablePath,
  codegen = false,
}) {
  const temporaryDirectory = await mkdtemp(
    path.join(
      process.platform === "darwin" ? "/tmp" : os.tmpdir(),
      "css-demo-",
    ),
  );
  const workspaceDirectory = path.join(temporaryDirectory, "workspace");
  const userDataDirectory = path.join(temporaryDirectory, "user");
  const completionFile = path.join(temporaryDirectory, "done");
  const remoteDebuggingPort = await freePort();

  let browser;
  let testRun;

  try {
    await mkdir(workspaceDirectory, { recursive: true });
    await mkdir(path.join(userDataDirectory, "User"), { recursive: true });
    await mkdir(path.join(temporaryDirectory, "extensions"), {
      recursive: true,
    });

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
        "demo/runtime/extension-host.cjs",
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

    return {
      page,
      browser,
      workspaceDirectory,
      temporaryDirectory,

      async complete() {
        await writeFile(completionFile, "done");
        await testRun;
      },

      async dispose() {
        await writeFile(completionFile, "done").catch(() => undefined);
        await testRun?.catch(() => undefined);
        await browser?.close().catch(() => undefined);
        await rm(temporaryDirectory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await writeFile(completionFile, "done").catch(() => undefined);
    await testRun?.catch(() => undefined);
    await browser?.close().catch(() => undefined);
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}
