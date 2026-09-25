export default function createScenario({
  createAnalysisMarkdown,
  hideDemoCaption,
  pause,
  runVSCodeCommand,
  showDemoCaption,
}) {
  return {
    recordingFile: "show-available-formats.webm",

    async prepareWorkspace({ workspaceDirectory }) {
      return createAnalysisMarkdown(workspaceDirectory);
    },

    async run({ page }) {
      await pause(2_500);
      await runVSCodeCommand(page, "JotebookSync: Show Available Formats");
      const output = page.locator(".output-view").first();
      await output.locator(".view-lines").first().waitFor({ timeout: 10_000 });

      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Available Jupytext formats",
          description:
            "JotebookSync lists every installed language and format code in the Output panel.",
        },
      });
      await pause(2_800);
      await hideDemoCaption({ page });
      await pause(500);

      const scrollableOutputs = output.locator(".monaco-scrollable-element");
      const scrollableOutputIndex = await scrollableOutputs.evaluateAll(
        (elements) => {
          let bestIndex = -1;
          let bestVisibleArea = 0;
          elements.forEach((element, index) => {
            const bounds = element.getBoundingClientRect();
            const visibleArea = bounds.width * bounds.height;
            if (
              bounds.width > 0 &&
              bounds.height > 0 &&
              visibleArea > bestVisibleArea
            ) {
              bestIndex = index;
              bestVisibleArea = visibleArea;
            }
          });
          return bestIndex;
        },
      );
      if (scrollableOutputIndex < 0) {
        throw new Error("Could not find the visible formats output scroller.");
      }
      const scrollableOutput = scrollableOutputs.nth(scrollableOutputIndex);
      const { maximumScroll, viewportHeight } = await scrollableOutput.evaluate(
        (element) => {
          element.scrollTop = 0;
          return {
            maximumScroll: Math.max(
              0,
              element.scrollHeight - element.clientHeight,
            ),
            viewportHeight: element.clientHeight,
          };
        },
      );
      const scrollCount = Math.min(
        8,
        Math.max(
          1,
          Math.ceil(maximumScroll / Math.max(1, viewportHeight * 0.8)),
        ),
      );

      await pause(900);
      for (let index = 1; index < scrollCount; index += 1) {
        const position = Math.round((maximumScroll * index) / scrollCount);
        await scrollableOutput.evaluate((element, top) => {
          element.scrollTop = top;
        }, position);
        await pause(900);
      }

      if (maximumScroll > 0) {
        await scrollableOutput.evaluate((element, top) => {
          element.scrollTop = top;
        }, maximumScroll);
        await pause(1_800);
      }
    },

    async verify({ page }) {
      await page
        .locator(".output-view .view-lines")
        .first()
        .waitFor({ timeout: 10_000 });
    },
  };
}
