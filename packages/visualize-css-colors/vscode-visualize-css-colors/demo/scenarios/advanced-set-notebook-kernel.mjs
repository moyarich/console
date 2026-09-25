import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileContains,
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  runVSCodeCommand,
  showDemoCaption,
}) {
  return {
    recordingFile: "advanced-set-notebook-kernel.webm",
    async prepareWorkspace({ workspaceDirectory }) {
      const pair = await createPairedAnalysis(workspaceDirectory);
      return pair.pythonFile;
    },
    async run({ page }) {
      await pause(2_000);
      await showDemoCaption({
        page,
        caption: {
          placement: "bottom-right",
          title: "Set the notebook kernel",
          description:
            "Next, the selected Python environment is attached to every notebook representation.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(page, "JotebookSync: Set Notebook Kernel");
      await fillVisibleQuickInput({ page, value: "jotebooksync-demo" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Kernel updated",
          description:
            "The kernel metadata now identifies the selected Python environment.",
        },
      });
      await pause(3_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: `${workspaceDirectory}/analysis.py`,
        expectedText: "name: jotebooksync-demo",
      });
    },
  };
}
