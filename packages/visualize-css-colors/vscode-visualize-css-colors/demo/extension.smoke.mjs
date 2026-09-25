import { spawn } from "node:child_process";
import {
  access,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";

import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";
import { chromium } from "playwright-core";
import colors from "colors/safe.js";

import { KEYBOARD_SHORTCUTS } from "./keyboard-shortcuts.mjs";
import { hideDemoCaption, showDemoCaption } from "./demo-caption.mjs";
import {
  installDemoCursorOverlay,
  pointDemoCursorAt,
  removeDemoCursorOverlay,
} from "./demo-cursor-overlay.mjs";

import exploreMenusAndTreeScenario from "./scenarios/explore-menus-and-tree.mjs";
import setupPairedFilesScenario from "./scenarios/setup-paired-files.mjs";
import reviewPairFreshnessScenario from "./scenarios/review-pair-freshness.mjs";
import syncNewestPairedFileScenario from "./scenarios/sync-newest-paired-file.mjs";
import createNotebookFromTextScenario from "./scenarios/create-notebook-from-text.mjs";
import projectPairingConfigurationScenario from "./scenarios/project-pairing-configuration.mjs";
import openPairedNotebookScenario from "./scenarios/open-paired-notebook.mjs";
import overwriteFromCurrentFileScenario from "./scenarios/overwrite-from-current-file.mjs";
import convertFileFormatScenario from "./scenarios/convert-file-format.mjs";
import testRoundTripConversionScenario from "./scenarios/test-round-trip-conversion.mjs";
import showAvailableFormatsScenario from "./scenarios/show-available-formats.mjs";
import updateExistingNotebookScenario from "./scenarios/update-existing-notebook.mjs";
import inspectAndRemovePairingScenario from "./scenarios/inspect-and-remove-pairing.mjs";
import advancedPipeExternalCommandScenario from "./scenarios/advanced-pipe-external-command.mjs";
import advancedCheckExternalCommandScenario from "./scenarios/advanced-check-external-command.mjs";
import advancedSetNotebookKernelScenario from "./scenarios/advanced-set-notebook-kernel.mjs";
import advancedExecuteNotebookScenario from "./scenarios/advanced-execute-notebook.mjs";
import advancedUpdateNotebookMetadataScenario from "./scenarios/advanced-update-notebook-metadata.mjs";
import advancedSetFormatOptionsScenario from "./scenarios/advanced-set-format-options.mjs";
import advancedRunPreCommitWorkflowScenario from "./scenarios/advanced-run-pre-commit-workflow.mjs";
import advancedRunJupytextCommandScenario from "./scenarios/advanced-run-jupytext-command.mjs";

// -----------------------------------------------------------------------------
// Paths
// -----------------------------------------------------------------------------

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));

const projectDirectory = path.dirname(testsDirectory);

const outputDirectory = path.join(projectDirectory, "demo", "artifacts");

const extensionTestsRunnerPath = path.join(
  testsDirectory,
  "extension-tests-runner.mjs",
);

const extensionsDirectory = path.join(
  projectDirectory,
  ".vscode-test",
  "extensions",
);

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

function getArgumentValue(name) {
  const prefix = `${name}=`;

  const argument = process.argv.find((value) => value.startsWith(prefix));

  return argument?.slice(prefix.length);
}

function getCliScenarioSelection() {
  const value = getArgumentValue("--scenario");

  if (!value) {
    return "all";
  }

  if (value === "all") {
    return "all";
  }

  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const config = {
  projectDirectory,
  outputDirectory,
  extensionTestsRunnerPath,
  extensionsDirectory,

  remoteDebuggingPort: 9334,
  frameRate: 10,
  windowSize: {
    width: 1280,
    height: 900,
  },

  workspace: {
    settings: {
      "workbench.colorTheme": "Default Dark Modern",
      "workbench.preferredDarkColorTheme": "Default Dark Modern",
      "window.autoDetectColorScheme": false,
      "window.systemColorTheme": "dark",
      "workbench.secondarySideBar.defaultVisibility": "hidden",
      "workbench.startupEditor": "none",
      "chat.commandCenter.enabled": false,

      // IMPORTANT:
      // Force VS Code to render context menus in the workbench DOM
      // instead of using the native macOS menu.
      "window.menuStyle": "custom",
    },
  },

  scenarios: getCliScenarioSelection(),
};

if (!process.argv.includes("--demo")) {
  throw new Error("Run this script with --demo to record the extension demo.");
}

// -----------------------------------------------------------------------------
// Timing
// -----------------------------------------------------------------------------

function pause(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const ignoredVSCodeDiagnostics = [
  "Warning: 'remote-debugging-port' is not in the list of known options",
  "Warning: 'cached-data' is not in the list of known options",
  "Unknown channel: agentHostClientByokLm",
  "Unknown channel: agentHostClientProxy",
  "[AgentHost] No signed-in session resolved for resource: https://api.github.com",
];

function createFilteredProcessOutput(destination) {
  let pending = "";
  return new Writable({
    write(chunk, _encoding, callback) {
      pending += chunk.toString();
      const lines = pending.split(/(?<=\n)/);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (
          !ignoredVSCodeDiagnostics.some((diagnostic) =>
            line.includes(diagnostic),
          )
        ) {
          destination.write(line);
        }
      }
      callback();
    },
    final(callback) {
      if (
        pending &&
        !ignoredVSCodeDiagnostics.some((diagnostic) =>
          pending.includes(diagnostic),
        )
      ) {
        destination.write(pending);
      }
      callback();
    },
  });
}

// -----------------------------------------------------------------------------
// Process helpers
// -----------------------------------------------------------------------------

function runProcess(
  command,
  args,
  {
    cwd = projectDirectory,
    env = process.env,
    stdio = "inherit",
    ...options
  } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio,
      ...options,
    });

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

// -----------------------------------------------------------------------------
// Temporary directories
// -----------------------------------------------------------------------------

function getTemporaryBaseDirectory() {
  /**
   * macOS Unix-domain sockets have a short path-length limit.
   *
   * VS Code creates an IPC socket inside --user-data-dir, so using
   * os.tmpdir() on macOS can produce paths such as:
   *
   * /var/folders/.../T/...
   *
   * which may exceed the IPC socket path limit.
   *
   * /tmp keeps the complete path intentionally short.
   */
  if (process.platform === "darwin") {
    return "/tmp";
  }

  return os.tmpdir();
}

async function createTemporaryDirectory() {
  return mkdtemp(path.join(getTemporaryBaseDirectory(), "js-"));
}

async function assertFileExists(filePath) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Demo expected a file that was not created: ${filePath}`);
  }
}

async function assertFileContains({ filePath, expectedText }) {
  await assertFileExists(filePath);
  const content = await readFile(filePath, "utf8");
  if (!content.includes(expectedText)) {
    throw new Error(
      `Demo expected ${path.basename(filePath)} to contain: ${expectedText}`,
    );
  }
}

async function assertNoJotebookErrors(page) {
  const notifications = await page
    .locator(".notification-list-item")
    .allTextContents();
  const errors = notifications.filter(
    (message) =>
      /jotebook[ -]?sync/i.test(message) &&
      /(?:could not|failed|error|requires .+ not found)/i.test(message),
  );
  if (errors.length > 0) {
    throw new Error(`JotebookSync reported an error: ${errors.join(" | ")}`);
  }
}

// -----------------------------------------------------------------------------
// VS Code environment
// -----------------------------------------------------------------------------

/**
 * Creates the complete VS Code environment before VS Code launches.
 *
 * Example:
 *
 * /tmp/js-AbCd12/
 * ├── u/
 * │   └── User/
 * │       └── settings.json
 * │
 * └── w/
 *     └── .vscode/
 *         └── settings.json
 *
 * Directory names are intentionally short because VS Code creates inter-process communication (IPC)
 * sockets under the user-data directory on macOS.
 */
async function createVSCodeEnvironment({ temporaryDirectory, settings }) {
  const userDataDirectory = path.join(temporaryDirectory, "u");

  const userSettingsDirectory = path.join(userDataDirectory, "User");

  const workspaceDirectory = path.join(temporaryDirectory, "w");

  const workspaceVSCodeDirectory = path.join(workspaceDirectory, ".vscode");

  await Promise.all([
    mkdir(userSettingsDirectory, {
      recursive: true,
    }),

    mkdir(workspaceVSCodeDirectory, {
      recursive: true,
    }),
  ]);

  const settingsJson = `${JSON.stringify(settings, null, 2)}\n`;

  /**
   * User settings are written before VS Code launches so its initial paint
   * uses the same appearance as the workspace.
   *
   * Workspace settings are still written so the theme remains
   * workspace-specific.
   */
  await Promise.all([
    writeFile(
      path.join(userSettingsDirectory, "settings.json"),
      settingsJson,
      "utf8",
    ),

    writeFile(
      path.join(workspaceVSCodeDirectory, "settings.json"),
      settingsJson,
      "utf8",
    ),
  ]);

  return {
    workspaceDirectory,
    userDataDirectory,
  };
}

// -----------------------------------------------------------------------------
// VS Code
// -----------------------------------------------------------------------------

async function resolveVSCodeExecutable() {
  const downloadedExecutable = await downloadAndUnzipVSCode();

  try {
    await access(downloadedExecutable);

    return downloadedExecutable;
  } catch {
    return downloadedExecutable.replace(/\/Electron$/, "/Code");
  }
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

// -----------------------------------------------------------------------------
// VS Code commands
// -----------------------------------------------------------------------------

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOpenFileTab({ page, fileName }) {
  const exactFileName = new RegExp(`^${escapeRegExp(fileName)}$`);

  return page
    .locator(".editor-group-container .tab")
    .filter({
      has: page.locator(".label-name", {
        hasText: exactFileName,
      }),
    })
    .first();
}

async function focusOpenFile({ page, fileName }) {
  const tab = page
    .locator(".editor-group-container .tab")
    .filter({ hasText: fileName })
    .last();

  if ((await tab.count()) === 0) {
    return false;
  }

  await tab.click();

  return true;
}

/**
 * If keyboard focus is currently somewhere inside an editor group,
 * click that group's selected tab.
 *
 * This is mainly useful when a notebook/webview currently owns keyboard
 * focus. Unlike `.editor-group-container.active`, `:focus-within`
 * reflects actual DOM focus.
 *
 * This function is intentionally best-effort. If no editor group
 * currently contains focus, nothing needs to be done.
 */
async function focusCurrentEditorTab({ page }) {
  const focusedGroup = page
    .locator(".editor-group-container:focus-within")
    .last();

  if ((await focusedGroup.count()) === 0) {
    return false;
  }

  const selectedTab = focusedGroup.locator('.tab[aria-selected="true"]');

  if ((await selectedTab.count()) === 0) {
    return false;
  }

  await selectedTab.click();

  return true;
}

async function openWorkspaceFile({ page, fileName, openToSide = false }) {
  // If this file is already open, don't open another copy.
  //
  // Clicking the existing tab also makes its editor group the
  // group subsequent operations work from.
  if (
    await focusOpenFile({
      page,
      fileName,
    })
  ) {
    return;
  }

  // Handle cases where a notebook/webview currently owns keyboard
  // focus. Do not wait for an "active" group class because VS Code
  // does not reliably expose one.
  await focusCurrentEditorTab({
    page,
  });

  const quickInput = page.locator(".quick-input-widget input:visible").last();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.keyboard.press(KEYBOARD_SHORTCUTS.quickOpen);
    try {
      await quickInput.waitFor({ state: "visible", timeout: 2_500 });
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await focusCurrentEditorTab({ page });
      await pause(300);
    }
  }

  await fillVisibleQuickInput({
    page,
    value: fileName,
  });

  await page.keyboard.press(
    openToSide ? KEYBOARD_SHORTCUTS.openToSide : KEYBOARD_SHORTCUTS.accept,
  );

  const tab = getOpenFileTab({
    page,
    fileName,
  });

  await tab.waitFor({
    state: "visible",
    timeout: 15_000,
  });

  // Important:
  //
  // Establish a predictable state for the next call.
  // This is the generalized equivalent of notebookTab.click().
  await tab.click();
}

//============--------------------
async function runVSCodeCommand(
  page,
  command,
  { typingDelay = 22, beforeSubmitPause = 900 } = {},
) {
  await page.keyboard.press(KEYBOARD_SHORTCUTS.commandPalette);

  await page.keyboard.type(command, {
    delay: typingDelay,
  });

  // Intentional demo pacing.
  await pause(beforeSubmitPause);

  await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
}

// -----------------------------------------------------------------------------
// VS Code Webviews
// -----------------------------------------------------------------------------

async function findFrameByHeading(
  page,
  headingName,
  { timeout = 30_000 } = {},
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const heading = frame.getByRole("heading", {
        name: headingName,
      });

      if (await heading.count()) {
        await heading.waitFor({
          timeout: 5_000,
        });

        return frame;
      }
    }

    await pause(250);
  }

  throw new Error(`Timed out waiting for webview heading: ${headingName}`);
}

async function scrollThroughWebview(
  frame,
  { pauseMilliseconds = 910, overlap = 0.2 } = {},
) {
  await frame.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await pause(pauseMilliseconds);

  const { viewportHeight, maximumScroll } = await frame.evaluate(() => ({
    viewportHeight: window.innerHeight,
    maximumScroll: Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  }));
  const step = Math.max(1, Math.floor(viewportHeight * (1 - overlap)));

  for (let position = step; position < maximumScroll; position += step) {
    await frame.evaluate(
      (top) => window.scrollTo({ top, behavior: "auto" }),
      position,
    );
    await pause(pauseMilliseconds);
  }

  if (maximumScroll > 0) {
    await frame.evaluate(
      (top) => window.scrollTo({ top, behavior: "auto" }),
      maximumScroll,
    );
    await pause(pauseMilliseconds);
  }
}

// -----------------------------------------------------------------------------
// Recording
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Demo files
// -----------------------------------------------------------------------------

async function createAnalysisMarkdown(workspaceDirectory) {
  const demoFile = path.join(workspaceDirectory, "analysis.md");

  await writeFile(
    demoFile,
    [
      "---",
      "jupyter:",
      "  jupytext:",
      "    text_representation:",
      "      extension: .md",
      "      format_name: myst",
      "      format_version: '0.13'",
      "      jupytext_version: 1.18.1",
      "  kernelspec:",
      "    display_name: Python 3",
      "    language: python",
      "    name: python3",
      "---",
      "",
      "# Sales analysis",
      "",
      "```{code-cell} ipython3",
      "revenue = [120, 145, 160, 190]",
      "sum(revenue)",
      "```",
      "",
    ].join("\n"),
    "utf8",
  );

  return demoFile;
}

async function createPlainMarkdown(workspaceDirectory) {
  const demoFile = path.join(workspaceDirectory, "analysis.md");
  await writeFile(
    demoFile,
    [
      "# Sales analysis",
      "",
      "```python",
      "revenue = [120, 145, 160, 190]",
      "sum(revenue)",
      "```",
      "",
    ].join("\n"),
    "utf8",
  );
  return demoFile;
}

async function createPairedAnalysis(workspaceDirectory) {
  const markdownFile = await createAnalysisMarkdown(workspaceDirectory);
  await runProcess(
    process.env.JOTEBOOKSYNC_PYTHON ?? "python",
    [
      "-m",
      "jupytext",
      "--set-formats",
      "ipynb,md:myst,py:percent",
      markdownFile,
    ],
    { cwd: workspaceDirectory },
  );

  return {
    markdownFile,
    notebookFile: path.join(workspaceDirectory, "analysis.ipynb"),
    pythonFile: path.join(workspaceDirectory, "analysis.py"),
  };
}

async function confirmQuickInput(page) {
  await page
    .locator(".quick-input-widget:visible")
    .waitFor({ timeout: 10_000 });
  await pause(700);
  await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
}

/**
 * Fills the active VS Code prompt and holds it on screen long enough for the
 * viewer to read the complete value before the scenario continues.
 */
async function fillVisibleQuickInput({ page, value, readingPause = 2_500 }) {
  const input = page.locator(".quick-input-widget input:visible").last();
  await input.waitFor({ timeout: 10_000 });
  await input.click();
  await input.fill(value);
  await pause(readingPause);
}

async function chooseVisibleQuickPickItem({ page, name }) {
  const widget = page.locator(".quick-input-widget:visible");
  await widget.waitFor({ timeout: 10_000 });
  const item = widget.getByText(name, { exact: true });
  await item.waitFor({ timeout: 10_000 });
  await item.click();
}

async function updatePairedPythonInput(pythonFile) {
  const content = await readFile(pythonFile, "utf8");
  await writeFile(
    pythonFile,
    content.replace(
      "revenue = [120, 145, 160, 190]",
      "revenue = [120, 145, 160, 190, 220]",
    ),
    "utf8",
  );
}

async function resizeVSCodeWindow({ page, width, height }) {
  await page.setViewportSize({ width, height });
}

// -----------------------------------------------------------------------------
// Scenarios
// -----------------------------------------------------------------------------

const scenarioDependencies = {
  assertFileContains,
  assertFileExists,
  chooseVisibleQuickPickItem,
  confirmQuickInput,
  createAnalysisMarkdown,
  createPairedAnalysis,
  createPlainMarkdown,
  fillVisibleQuickInput,
  findFrameByHeading,
  hideDemoCaption,
  installDemoCursorOverlay,
  openWorkspaceFile,
  path,
  pause,
  pointDemoCursorAt,
  readFile,
  readdir,
  removeDemoCursorOverlay,
  runProcess,
  runVSCodeCommand,
  scrollThroughWebview,
  showDemoCaption,
  updatePairedPythonInput,
  writeFile,
};

const demoScenarios = {
  "explore-menus-and-tree": exploreMenusAndTreeScenario(scenarioDependencies),
  "setup-paired-files": setupPairedFilesScenario(scenarioDependencies),
  "review-pair-freshness": reviewPairFreshnessScenario(scenarioDependencies),
  "sync-newest-paired-file": syncNewestPairedFileScenario(scenarioDependencies),
  "create-notebook-from-text":
    createNotebookFromTextScenario(scenarioDependencies),
  "project-pairing-configuration":
    projectPairingConfigurationScenario(scenarioDependencies),
  "open-paired-notebook": openPairedNotebookScenario(scenarioDependencies),
  "overwrite-from-current-file":
    overwriteFromCurrentFileScenario(scenarioDependencies),
  "convert-file-format": convertFileFormatScenario(scenarioDependencies),
  "test-round-trip-conversion":
    testRoundTripConversionScenario(scenarioDependencies),
  "show-available-formats": showAvailableFormatsScenario(scenarioDependencies),
  "update-existing-notebook":
    updateExistingNotebookScenario(scenarioDependencies),
  "inspect-and-remove-pairing":
    inspectAndRemovePairingScenario(scenarioDependencies),
  "advanced-pipe-external-command":
    advancedPipeExternalCommandScenario(scenarioDependencies),
  "advanced-check-external-command":
    advancedCheckExternalCommandScenario(scenarioDependencies),
  "advanced-set-notebook-kernel":
    advancedSetNotebookKernelScenario(scenarioDependencies),
  "advanced-execute-notebook":
    advancedExecuteNotebookScenario(scenarioDependencies),
  "advanced-update-notebook-metadata":
    advancedUpdateNotebookMetadataScenario(scenarioDependencies),
  "advanced-set-format-options":
    advancedSetFormatOptionsScenario(scenarioDependencies),
  "advanced-run-pre-commit-workflow":
    advancedRunPreCommitWorkflowScenario(scenarioDependencies),
  "advanced-run-jupytext-command":
    advancedRunJupytextCommandScenario(scenarioDependencies),
};

// -----------------------------------------------------------------------------
// Scenario selection
// -----------------------------------------------------------------------------

function resolveScenarioNames({ selection, scenarios }) {
  const availableNames = Object.keys(scenarios);

  if (selection === "all") {
    return availableNames;
  }

  const requestedNames = Array.isArray(selection) ? selection : [selection];

  const unknownNames = requestedNames.filter((name) => !scenarios[name]);

  if (unknownNames.length > 0) {
    throw new Error(
      [
        `Unknown demo scenario${
          unknownNames.length > 1 ? "s" : ""
        }: ${unknownNames.join(", ")}`,
        "",
        "Available scenarios:",
        ...availableNames.map((name) => `  - ${name}`),
      ].join("\n"),
    );
  }

  return requestedNames;
}

// -----------------------------------------------------------------------------
// Run one scenario
// -----------------------------------------------------------------------------

async function runScenario({ name, scenario, config, vscodeExecutable }) {
  console.log(`\nRecording scenario: ${name}`);

  // ---------------------------------------------------------------------------
  // Temporary root
  // ---------------------------------------------------------------------------

  const temporaryDirectory = await createTemporaryDirectory();

  // ---------------------------------------------------------------------------
  // Resolve scenario workspace settings
  // ---------------------------------------------------------------------------

  const workspaceSettings = {
    ...config.workspace.settings,
    ...scenario.workspace?.settings,
  };

  // ---------------------------------------------------------------------------
  // Create VS Code environment BEFORE launching VS Code
  // ---------------------------------------------------------------------------

  const { workspaceDirectory, userDataDirectory } =
    await createVSCodeEnvironment({
      temporaryDirectory,
      settings: workspaceSettings,
    });

  // ---------------------------------------------------------------------------
  // Paths
  // ---------------------------------------------------------------------------

  const completionFile = path.join(temporaryDirectory, "done");

  const scenarioOutputDirectory = path.join(config.outputDirectory, name);

  const framesDirectory = path.join(scenarioOutputDirectory, "frames");

  const recordingPath = path.join(
    scenarioOutputDirectory,
    scenario.recordingFile,
  );

  let browser;
  let recorder;
  let testRun;

  try {
    // -------------------------------------------------------------------------
    // Prepare output
    // -------------------------------------------------------------------------

    await mkdir(scenarioOutputDirectory, {
      recursive: true,
    });

    await rm(framesDirectory, {
      recursive: true,
      force: true,
    });

    await mkdir(framesDirectory, {
      recursive: true,
    });

    // -------------------------------------------------------------------------
    // Prepare scenario files
    // -------------------------------------------------------------------------

    const demoFile = await scenario.prepareWorkspace({
      workspaceDirectory,
      temporaryDirectory,
      config,
    });

    // -------------------------------------------------------------------------
    // Start VS Code
    // -------------------------------------------------------------------------

    testRun = runTests({
      vscodeExecutablePath: vscodeExecutable,

      extensionDevelopmentPath: config.projectDirectory,

      extensionTestsPath: config.extensionTestsRunnerPath,

      // VS Code reports Chromium recording switches as unknown CLI options,
      // even though it forwards and applies them. Keep real stderr visible
      // while suppressing only those known, non-failing diagnostics.
      stdout: createFilteredProcessOutput(process.stdout),
      stderr: createFilteredProcessOutput(process.stderr),

      extensionTestsEnv: {
        ...process.env,

        EXTENSION_DEMO_COMPLETION_FILE: completionFile,
        JOTEBOOKSYNC_DEMO_AUTO_CONFIRM: "1",
      },

      launchArgs: [
        workspaceDirectory,

        demoFile,

        /**
         * Isolated user profile.
         *
         * The path is deliberately short because VS Code creates a Unix-domain
         * IPC socket under this directory on macOS.
         */
        `--user-data-dir=${userDataDirectory}`,

        `--extensions-dir=${config.extensionsDirectory}`,

        `--remote-debugging-port=${config.remoteDebuggingPort}`,

        "--new-window",
      ],
    });

    // -------------------------------------------------------------------------
    // Connect Playwright
    // -------------------------------------------------------------------------

    const endpoint = await waitForVSCodeDevTools({
      remoteDebuggingPort: config.remoteDebuggingPort,
    });

    browser = await chromium.connectOverCDP(endpoint);

    const page = await findVSCodeWorkbenchPage(browser);

    await resizeVSCodeWindow({ page, ...config.windowSize });
    // Apply stable recording preferences once. Passing `animations: "disabled"`
    // to every screenshot repeatedly injects and removes animation overrides,
    // which makes transition-heavy webviews visibly flash while recording.
    const configuredTheme = String(
      workspaceSettings["workbench.colorTheme"] ?? "",
    );
    await page.emulateMedia({
      colorScheme: /light/i.test(configuredTheme) ? "light" : "dark",
      reducedMotion: "reduce",
    });

    const secondarySidebar = page.locator(".part.auxiliarybar");
    if (await secondarySidebar.isVisible().catch(() => false)) {
      await page.keyboard.press(KEYBOARD_SHORTCUTS.toggleSecondarySidebar);
      await pause(500);
    }

    // -------------------------------------------------------------------------
    // Start recording
    // -------------------------------------------------------------------------

    recorder = createFrameRecorder({
      page,
      framesDirectory,
      frameRate: config.frameRate,
    });

    await recorder.start();

    // -------------------------------------------------------------------------
    // Run scenario
    // -------------------------------------------------------------------------

    if (scenario.introCaption) {
      await showDemoCaption({ page, caption: scenario.introCaption });
      await pause(2_800);
      await hideDemoCaption({ page });
      await pause(500);
    }

    await scenario.run({
      page,
      browser,
      workspaceDirectory,
      temporaryDirectory,
      config,
    });

    await scenario.verify?.({
      page,
      browser,
      workspaceDirectory,
      temporaryDirectory,
      config,
    });
    await assertNoJotebookErrors(page);

    // -------------------------------------------------------------------------
    // Stop recording
    // -------------------------------------------------------------------------

    await recorder.stop();

    // -------------------------------------------------------------------------
    // Encode recording
    // -------------------------------------------------------------------------

    await encodeRecording({
      framesDirectory,
      recordingPath,
      frameRate: config.frameRate,
    });

    console.log(`Created: ${recordingPath}`);

    // -------------------------------------------------------------------------
    // Tell the extension test runner it can exit
    // -------------------------------------------------------------------------

    await writeFile(completionFile, "done\n", "utf8");

    await testRun;

    return {
      name,
      recordingPath,
    };
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    await recorder?.stop().catch(() => undefined);

    await writeFile(completionFile, "done\n", "utf8").catch(() => undefined);

    await testRun?.catch(() => undefined);

    await browser?.close().catch(() => undefined);

    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
}

// -----------------------------------------------------------------------------
// Demo runner
// -----------------------------------------------------------------------------

async function runDemo(config) {
  const scenarioNames = resolveScenarioNames({
    selection: config.scenarios,
    scenarios: demoScenarios,
  });

  console.log(
    [
      "",
      "JotebookSync demo recorder",
      "",
      "Each scenario runs in an isolated VS Code window and workspace.",
      `Scenarios: ${scenarioNames.join(", ")}`,
      `Frame rate: ${config.frameRate}`,
      `Window size: ${config.windowSize.width}x${config.windowSize.height}`,
      `Theme: ${
        config.workspace.settings["workbench.colorTheme"] ?? "VS Code default"
      }`,
      "",
    ].join("\n"),
  );

  const recordings = [];
  let activeScenario;
  let setupCompleted = false;

  try {
    // -------------------------------------------------------------------------
    // Compile once
    // -------------------------------------------------------------------------

    await runProcess("npm", ["run", "compile"], {
      cwd: config.projectDirectory,
    });

    // -------------------------------------------------------------------------
    // Resolve VS Code once
    // -------------------------------------------------------------------------

    const vscodeExecutable = await resolveVSCodeExecutable();
    setupCompleted = true;

    // -------------------------------------------------------------------------
    // Run scenarios sequentially
    // -------------------------------------------------------------------------

    for (const name of scenarioNames) {
      activeScenario = name;
      const result = await runScenario({
        name,
        scenario: demoScenarios[name],
        config,
        vscodeExecutable,
      });

      recordings.push(result);
      activeScenario = undefined;
    }

    return recordings;
  } finally {
    // -------------------------------------------------------------------------
    // Summary — also runs before a setup or scenario error is rethrown
    // -------------------------------------------------------------------------

    const completedNames = new Set(recordings.map(({ name }) => name));
    const notRun = scenarioNames.filter(
      (name) => name !== activeScenario && !completedNames.has(name),
    );
    const completedLines =
      recordings.length > 0
        ? recordings.map(
            ({ name, recordingPath }) =>
              `${colors.green(`  ✓ ${name}`)}\n${colors.dim(`    ${recordingPath}`)}`,
          )
        : ["  None"];
    const failedLines = activeScenario
      ? [colors.red(`  ✗ ${activeScenario}`)]
      : setupCompleted
        ? ["  None"]
        : [colors.red("  Demo setup failed before any scenario ran.")];
    const notRunLines =
      notRun.length > 0
        ? notRun.map((name) => colors.yellow(`  - ${name}`))
        : ["  None"];

    console.log(
      [
        "",
        colors.bold("Demo scenario summary"),
        "",
        colors.green(
          `Completed (${recordings.length}/${scenarioNames.length}):`,
        ),
        ...completedLines,
        "",
        colors.red("Failed:"),
        ...failedLines,
        "",
        colors.yellow(`Not run (${notRun.length}):`),
        ...notRunLines,
        "",
      ].join("\n"),
    );
  }
}

// -----------------------------------------------------------------------------
// Run
// -----------------------------------------------------------------------------

await runDemo(config);
