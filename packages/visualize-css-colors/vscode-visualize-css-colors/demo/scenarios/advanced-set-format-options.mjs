import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileContains,
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  runVSCodeCommand,
  showDemoCaption,
  openWorkspaceFile,
}) {
  return {
    recordingFile: "advanced-set-format-options.webm",
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
          title: "Set format options",
          description:
            "Next, a format option changes how Jupytext writes this notebook's text representation.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(page, "JotebookSync: Set Format Options");
      await fillVisibleQuickInput({ page, value: "comment_magics=true" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Format options saved",
          description:
            "The paired text representation now records the selected writing option.",
        },
      });
      await pause(3_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: `${workspaceDirectory}/analysis.py`,
        expectedText: "comment_magics: true",
      });
    },
  };
}
