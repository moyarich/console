import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileExists,
  createPlainMarkdown,
  findFrameByHeading,
  installDemoCursorOverlay,
  openWorkspaceFile,
  path,
  pause,
  pointDemoCursorAt,
  readdir,
  removeDemoCursorOverlay,
  runVSCodeCommand,
  scrollThroughWebview,
}) {
  return {
    recordingFile: "setup-paired-files.webm",
    introCaption: {
      placement: "top-right",
      title: "Configure paired files",
      description:
        "Choose the notebook, Markdown, and script formats that JotebookSync will keep together.",
    },

    async prepareWorkspace({ workspaceDirectory }) {
      return createPlainMarkdown(workspaceDirectory);
    },

    async run({ page }) {
      // Show initial editor.
      await pause(1_500);

      // -----------------------------------------------------------------------
      // Open setup command
      // -----------------------------------------------------------------------

      await runVSCodeCommand(page, "JotebookSync: Configure Paired Files");

      // -----------------------------------------------------------------------
      // Wait for setup webview
      // -----------------------------------------------------------------------

      const setupFrame = await findFrameByHeading(
        page,
        /Configure paired files/i,
      );

      await installDemoCursorOverlay({ page });

      await pause(1_500);

      // -----------------------------------------------------------------------
      // Advanced options
      // -----------------------------------------------------------------------

      const advancedOptions = setupFrame.getByText("Advanced options", {
        exact: true,
      });

      await advancedOptions.waitFor({
        timeout: 10_000,
      });

      await pointDemoCursorAt({ page, locator: advancedOptions });
      await advancedOptions.click();

      await pause(1_200);

      // -----------------------------------------------------------------------
      // Python percent script
      // -----------------------------------------------------------------------

      const percentOption = setupFrame.getByText("Python percent script", {
        exact: true,
      });

      if (await percentOption.count()) {
        await pointDemoCursorAt({ page, locator: percentOption });
        await percentOption.click();

        await pause(1_500);
      }

      // Tour every section, including all advanced formats and the custom
      // format controls, before submitting from the page footer.
      await removeDemoCursorOverlay({ page });
      await scrollThroughWebview(setupFrame);

      // -----------------------------------------------------------------------
      // Submit
      // -----------------------------------------------------------------------

      const submit = setupFrame.getByRole("button", {
        name: /Create pair|Save changes/i,
      });

      await submit.waitFor({
        timeout: 10_000,
      });

      await installDemoCursorOverlay({ page });
      await pointDemoCursorAt({ page, locator: submit });
      await submit.click();

      await pause(2_500);
      await removeDemoCursorOverlay({ page });

      // End on the real payoff: all three representations visible together.
      for (const shortcut of KEYBOARD_SHORTCUTS.closeAllEditors) {
        await page.keyboard.press(shortcut);
      }
      await pause(700);

      await openWorkspaceFile({ page, fileName: "analysis.md" });

      await openWorkspaceFile({
        page,
        fileName: "analysis.ipynb",
        openToSide: true,
      });

      await openWorkspaceFile({
        page,
        fileName: "analysis.percent.py",
        openToSide: true,
      });

      await pause(10_000);
    },

    async verify({ page, workspaceDirectory }) {
      await assertFileExists(path.join(workspaceDirectory, "analysis.ipynb"));
      const files = await readdir(workspaceDirectory);
      if (!files.some((file) => file.endsWith(".py"))) {
        throw new Error(
          "Pair setup did not create the selected Python format.",
        );
      }
      const visibleGroups = await page
        .locator(".editor-group-container:visible")
        .count();
      if (visibleGroups < 3) {
        throw new Error(
          "Pair setup demo did not show Markdown, notebook, and Python side by side.",
        );
      }
    },
  };
}
