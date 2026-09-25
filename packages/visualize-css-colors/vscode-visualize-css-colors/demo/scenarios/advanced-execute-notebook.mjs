import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileExists,
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  readFile,
  runVSCodeCommand,
  showDemoCaption,
  writeFile,
}) {
  return {
    recordingFile: "advanced-execute-notebook.webm",
    async prepareWorkspace({ workspaceDirectory }) {
      const pair = await createPairedAnalysis(workspaceDirectory);
      const content = await readFile(pair.pythonFile, "utf8");
      await writeFile(
        pair.pythonFile,
        `${content.replace("name: python3", "name: jotebooksync-demo")}\nfrom pathlib import Path\nPath("execution-complete.txt").write_text("Notebook executed")\n`,
        "utf8",
      );
      return pair.pythonFile;
    },
    async run({ page }) {
      await pause(2_000);
      await showDemoCaption({
        page,
        caption: {
          placement: "bottom-right",
          title: "Execute the notebook",
          description:
            "Next, every cell runs with the notebook folder as its working directory.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(page, "JotebookSync: Execute Notebook");
      await fillVisibleQuickInput({ page, value: "" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Execution complete",
          description:
            "The notebook ran in its own folder and produced its output file.",
        },
      });
      await pause(5_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileExists(`${workspaceDirectory}/execution-complete.txt`);
    },
  };
}
