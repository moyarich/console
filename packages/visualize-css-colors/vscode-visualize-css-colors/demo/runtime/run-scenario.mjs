import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureScenario } from "./codegen-recorder.mjs";
import {
  createVSCodeRuntime,
  pause,
  prepareVSCodeRuntime,
  projectDirectory,
} from "./vscode-runtime.mjs";
import {
  createFrameRecorder,
  encodeRecording,
  ensureVideoEncoder,
} from "./video-recorder.mjs";
import {
  hideDemoCaption,
  showDemoCaption,
} from "../ui/caption/install.mjs";
import {
  installDemoMagnifierCursorOverlay,
  pointDemoMagnifierCursorAt,
  removeDemoMagnifierCursorOverlay,
} from "../ui/magnifier/install.mjs";

export function isDirectScenario(moduleUrl) {
  return Boolean(
    process.argv[1] &&
      path.resolve(process.argv[1]) === path.resolve(fileURLToPath(moduleUrl)),
  );
}

export async function prepareDemoRuntime({ codegen = false } = {}) {
  if (!codegen) {
    await ensureVideoEncoder();
  }

  return prepareVSCodeRuntime();
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
    throw new Error(
      `Scenario "${name}" must define run({ page, ...helpers }).`,
    );
  }

  const executable =
    vscodeExecutablePath ?? (await prepareDemoRuntime({ codegen }));
  const outputDirectory = path.join(projectDirectory, "demo/artifacts", name);
  const framesDirectory = path.join(outputDirectory, "frames");
  const runtime = await createVSCodeRuntime({
    scenario,
    vscodeExecutablePath: executable,
    codegen,
  });

  let recorder;

  try {
    if (codegen) {
      await captureScenario({
        page: runtime.page,
        name,
        baseScenarioName: scenario.baseScenarioName ?? scenario.name ?? name,
        projectDirectory,
      });

      return;
    }

    await rm(framesDirectory, { recursive: true, force: true });
    await mkdir(framesDirectory, { recursive: true });

    recorder = createFrameRecorder({
      page: runtime.page,
      framesDirectory,
      frameRate: 10,
    });

    await recorder.start();

    await scenario.run({
      page: runtime.page,
      browser: runtime.browser,
      name,
      workspaceDirectory: runtime.workspaceDirectory,
      temporaryDirectory: runtime.temporaryDirectory,
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

    await runtime.complete();

    console.log(`Recorded ${name}: ${outputDirectory}`);
  } finally {
    await recorder?.stop().catch(() => undefined);
    await runtime.dispose();
  }
}

export async function runScenarioModule({ moduleUrl, name, scenario }) {
  if (!isDirectScenario(moduleUrl)) {
    return;
  }

  const codegen = process.argv.includes("--codegen");
  const executable = await prepareDemoRuntime({ codegen });

  await runScenario({
    name,
    scenario,
    vscodeExecutablePath: executable,
    codegen,
  });
}
