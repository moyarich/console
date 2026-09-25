export default function createScenario({
  assertFileContains,
  createPairedAnalysis,
  path,
  pause,
  readFile,
  runVSCodeCommand,
  writeFile,
}) {
  return {
    recordingFile: "update-existing-notebook.webm",
    introCaption: {
      placement: "bottom-right",
      title: "Update an existing notebook",
      description:
        "Write changes from the active text notebook back into its existing .ipynb file.",
    },

    async prepareWorkspace({ workspaceDirectory }) {
      const pair = await createPairedAnalysis(workspaceDirectory);
      await writeFile(
        pair.markdownFile,
        `${await readFile(pair.markdownFile, "utf8")}\nUpdated from the text notebook.\n`,
        "utf8",
      );
      return pair.markdownFile;
    },

    async run({ page }) {
      await pause(2_500);
      await runVSCodeCommand(
        page,
        "JotebookSync: Update Existing Notebook from Text File",
      );
      await pause(5_000);
    },

    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: path.join(workspaceDirectory, "analysis.ipynb"),
        expectedText: "Updated from the text notebook.",
      });
    },
  };
}
