import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileContains,
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  pause,
  readFile,
  runProcess,
  runVSCodeCommand,
  showDemoCaption,
  writeFile,
}) {
  return {
    recordingFile: "advanced-run-pre-commit-workflow.webm",
    async prepareWorkspace({ workspaceDirectory }) {
      const pair = await createPairedAnalysis(workspaceDirectory);
      await runProcess("git", ["init"], { cwd: workspaceDirectory });
      await runProcess("git", ["config", "user.email", "demo@example.com"], {
        cwd: workspaceDirectory,
      });
      await runProcess("git", ["config", "user.name", "JotebookSync Demo"], {
        cwd: workspaceDirectory,
      });
      await runProcess("git", ["add", "."], { cwd: workspaceDirectory });
      await runProcess("git", ["commit", "-m", "Paired notebook baseline"], {
        cwd: workspaceDirectory,
      });

      const source = await readFile(pair.pythonFile, "utf8");
      await writeFile(
        pair.pythonFile,
        source.replace(
          "revenue = [120, 145, 160, 190]",
          "revenue = [120, 145, 160, 190, 220]",
        ),
        "utf8",
      );
      await runProcess("git", ["add", "analysis.py"], {
        cwd: workspaceDirectory,
      });
      return pair.pythonFile;
    },
    async run({ page }) {
      await pause(2_000);
      await showDemoCaption({
        page,
        caption: {
          placement: "bottom-right",
          title: "Before synchronization",
          description:
            "The Python file is staged, but its paired notebook is still at the baseline.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await page.keyboard.press(KEYBOARD_SHORTCUTS.sourceControl);
      await pause(2_500);

      await showDemoCaption({
        page,
        caption: {
          placement: "bottom-right",
          title: "Run the pre-commit workflow",
          description:
            "Next, JotebookSync updates paired files from the notebook representations staged in Git.",
        },
      });
      await pause(2_400);
      await hideDemoCaption({ page });
      await pause(600);
      await runVSCodeCommand(page, "JotebookSync: Run Pre-commit Workflow");
      await fillVisibleQuickInput({ page, value: "py:percent" });
      await page.keyboard.press(KEYBOARD_SHORTCUTS.accept);
      await pause(3_000);

      await page.keyboard.press(KEYBOARD_SHORTCUTS.sourceControl);
      await showDemoCaption({
        page,
        caption: {
          placement: { top: "64px", right: "24px" },
          title: "Ready to commit",
          description:
            "Jupytext synchronized and staged the paired notebook alongside the Python change.",
        },
      });
      await pause(4_000);
      await hideDemoCaption({ page });
    },
    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: `${workspaceDirectory}/analysis.ipynb`,
        expectedText: "220",
      });
    },
  };
}
