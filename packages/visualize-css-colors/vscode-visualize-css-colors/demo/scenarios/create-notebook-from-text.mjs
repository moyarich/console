import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  assertFileExists,
  createAnalysisMarkdown,
  openWorkspaceFile,
  path,
  pause,
  runVSCodeCommand,
}) {
  return {
    recordingFile: "create-notebook-from-text.webm",
    introCaption: {
      placement: "bottom-right",
      title: "Create a notebook from text",
      description:
        "Turn the active text notebook into an .ipynb file and view both versions side by side.",
    },

    async prepareWorkspace({ workspaceDirectory }) {
      return createAnalysisMarkdown(workspaceDirectory);
    },

    async run({ page }) {
      await pause(2_000);
      await runVSCodeCommand(
        page,
        "JotebookSync: Create Notebook from Text File",
      );
      await page.locator(".notebook-editor").first().waitFor({
        timeout: 15_000,
      });

      // Finish on the result instead of an apparently empty notebook canvas:
      // keep the source text visible beside the rendered notebook it created.
      await page
        .locator(".editor-group-container .tab")
        .filter({ hasText: "analysis.ipynb" })
        .first()
        .click();
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
      await page.locator(".notebook-editor").first().waitFor({
        timeout: 15_000,
      });
      await pause(4_000);
    },

    async verify({ page, workspaceDirectory }) {
      await assertFileExists(path.join(workspaceDirectory, "analysis.ipynb"));
      const visibleGroups = await page
        .locator(".editor-group-container:visible")
        .count();
      if (visibleGroups !== 2) {
        throw new Error(
          "Create-notebook demo did not show source Markdown and notebook side by side.",
        );
      }
      for (const fileName of ["analysis.md", "analysis.ipynb"]) {
        const visibleTabs = await page
          .locator(`.tab:visible`)
          .filter({ hasText: fileName })
          .count();
        if (visibleTabs !== 1) {
          throw new Error(
            `Create-notebook demo showed ${visibleTabs} tabs for ${fileName}.`,
          );
        }
      }
    },
  };
}
