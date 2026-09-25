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
    recordingFile: "advanced-update-notebook-metadata.webm",
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
          title: "Update notebook metadata",
          description:
            "Next, structured metadata is added without editing front matter by hand.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(page, "JotebookSync: Update Notebook Metadata");
      await fillVisibleQuickInput({
        page,
        value: '{"jupytext":{"custom_cell_magics":"kql"}}',
      });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Metadata updated",
          description:
            "The structured metadata is visible in the paired text representation.",
        },
      });
      await pause(3_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: `${workspaceDirectory}/analysis.py`,
        expectedText: "custom_cell_magics: kql",
      });
    },
  };
}
