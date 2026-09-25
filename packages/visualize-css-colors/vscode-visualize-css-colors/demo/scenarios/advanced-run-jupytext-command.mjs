import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileExists,
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  runVSCodeCommand,
  showDemoCaption,
}) {
  return {
    recordingFile: "advanced-run-jupytext-command.webm",
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
          title: "Run a Jupytext command",
          description:
            "Next, raw CLI arguments create another notebook while JotebookSync supplies Python and Jupytext.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(
        page,
        "JotebookSync: Run Advanced Jupytext Command",
      );
      await fillVisibleQuickInput({
        page,
        value: '["--to","ipynb","--output","advanced.ipynb","analysis.py"]',
      });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Command complete",
          description:
            "Jupytext created advanced.ipynb from the supplied CLI arguments.",
        },
      });
      await pause(3_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileExists(`${workspaceDirectory}/advanced.ipynb`);
    },
  };
}
