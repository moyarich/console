export default function createScenario({
  assertFileContains,
  createAnalysisMarkdown,
  findFrameByHeading,
  installDemoCursorOverlay,
  path,
  pause,
  pointDemoCursorAt,
  removeDemoCursorOverlay,
  runProcess,
  runVSCodeCommand,
}) {
  return {
    recordingFile: "convert-file-format.webm",
    introCaption: {
      placement: "top-right",
      title: "Convert to another format",
      description:
        "Choose a Jupytext format in the guided webview and create an equivalent file.",
    },

    async prepareWorkspace({ workspaceDirectory }) {
      const markdownFile = await createAnalysisMarkdown(workspaceDirectory);
      const notebookFile = path.join(workspaceDirectory, "analysis.ipynb");
      await runProcess(
        process.env.JOTEBOOKSYNC_PYTHON ?? "python",
        [
          "-m",
          "jupytext",
          "--to",
          "ipynb",
          "--output",
          notebookFile,
          markdownFile,
        ],
        { cwd: workspaceDirectory },
      );
      return notebookFile;
    },

    async run({ page }) {
      await pause(2_500);
      await runVSCodeCommand(
        page,
        "JotebookSync: Convert File to Another Format",
      );
      const convertFrame = await findFrameByHeading(
        page,
        /Convert file to another format/i,
      );
      await installDemoCursorOverlay({ page });
      const formatSelect = convertFrame.locator("#format");
      await pointDemoCursorAt({ page, locator: formatSelect });
      await formatSelect.selectOption("py:percent");
      await pause(1_200);
      const convertButton = convertFrame.getByRole("button", {
        name: "Convert file",
      });
      await pointDemoCursorAt({ page, locator: convertButton });
      await convertButton.click();
      await removeDemoCursorOverlay({ page });
      await pause(4_000);
    },

    async verify({ workspaceDirectory }) {
      await assertFileContains({
        filePath: path.join(workspaceDirectory, "analysis.py"),
        expectedText: "revenue",
      });
    },
  };
}
