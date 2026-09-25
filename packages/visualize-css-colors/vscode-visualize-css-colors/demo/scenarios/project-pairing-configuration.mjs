export default function createScenario({
  assertFileExists,
  confirmQuickInput,
  createAnalysisMarkdown,
  path,
  pause,
  runVSCodeCommand,
}) {
  return {
    recordingFile: "project-pairing-configuration.webm",
    introCaption: {
      placement: "bottom-right",
      title: "Save project-wide pairing defaults",
      description:
        "Create jupytext.toml so every notebook in the workspace can share the same pairing rules.",
    },

    async prepareWorkspace({ workspaceDirectory }) {
      return createAnalysisMarkdown(workspaceDirectory);
    },

    async run({ page }) {
      await pause(2_000);
      await runVSCodeCommand(
        page,
        "JotebookSync: Create Project Pairing Configuration",
      );
      await confirmQuickInput(page);
      await pause(3_000);
    },

    async verify({ workspaceDirectory }) {
      await assertFileExists(path.join(workspaceDirectory, "jupytext.toml"));
    },
  };
}
