import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileContains,
  chooseVisibleQuickPickItem,
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  runVSCodeCommand,
  showDemoCaption,
}) {
  return {
    recordingFile: "advanced-pipe-external-command.webm",
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
          title: "Pipe through an external command",
          description:
            "Next, an external command transforms the notebook text before Jupytext writes it back.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(
        page,
        "JotebookSync: Pipe Through External Command",
      );
      await fillVisibleQuickInput({
        page,
        value:
          "python -c \"import sys; print(sys.stdin.read().replace('Sales analysis', 'Piped sales analysis'), end='')\"",
      });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await fillVisibleQuickInput({ page, value: "py:percent" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await chooseVisibleQuickPickItem({
        page,
        name: "Pipe and synchronize the pair",
      });
      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Transformation complete",
          description:
            "The external command changed the text and Jupytext synchronized the pair.",
        },
      });
      await pause(3_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: `${workspaceDirectory}/analysis.py`,
        expectedText: "Piped sales analysis",
      });
    },
  };
}
