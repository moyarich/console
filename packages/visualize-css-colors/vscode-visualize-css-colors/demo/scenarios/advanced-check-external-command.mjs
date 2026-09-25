import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  runVSCodeCommand,
  showDemoCaption,
}) {
  return {
    recordingFile: "advanced-check-external-command.webm",
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
          title: "Check with an external command",
          description:
            "Next, JotebookSync validates a generated Python representation without replacing the notebook.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(page, "JotebookSync: Check with External Command");
      await fillVisibleQuickInput({ page, value: "python -m py_compile {}" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await fillVisibleQuickInput({ page, value: "py:percent" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Check complete",
          description:
            "The external validator accepted the Python representation.",
        },
      });
      await pause(3_000);
      await hideDemoCaption({ page });
    },
  };
}
