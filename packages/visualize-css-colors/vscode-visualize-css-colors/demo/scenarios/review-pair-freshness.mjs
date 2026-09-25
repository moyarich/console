export default function createScenario({
  createPairedAnalysis,
  findFrameByHeading,
  installDemoCursorOverlay,
  pause,
  pointDemoCursorAt,
  readFile,
  removeDemoCursorOverlay,
  runVSCodeCommand,
  scrollThroughWebview,
  writeFile,
}) {
  return {
    recordingFile: "review-pair-freshness.webm",
    introCaption: {
      placement: "top-right",
      title: "Review before syncing",
      description:
        "Compare timestamps and content evidence before choosing which paired file should win.",
    },
    async prepareWorkspace({ workspaceDirectory }) {
      const pair = await createPairedAnalysis(workspaceDirectory);
      await pause(1_100);
      await writeFile(
        pair.markdownFile,
        `${await readFile(pair.markdownFile, "utf8")}\nUpdated in the Markdown notebook.\n`,
        "utf8",
      );
      return pair.pythonFile;
    },

    async run({ page }) {
      await pause(4_000);
      await runVSCodeCommand(page, "JotebookSync: Review Pair Freshness");
      const reportFrame = await findFrameByHeading(
        page,
        /Review paired files/i,
      );
      await installDemoCursorOverlay({ page });

      // Demonstrate the report toolbar rather than merely opening the page.
      const filterSelect = reportFrame.getByLabel("Filter destination files");
      await pointDemoCursorAt({ page, locator: filterSelect });
      await filterSelect.selectOption("review");
      await pause(900);
      const sortSelect = reportFrame.getByLabel("Sort destination files");
      await pointDemoCursorAt({ page, locator: sortSelect });
      await sortSelect.selectOption("name-asc");
      await pause(900);

      const destinationCard = reportFrame
        .locator("#destinationList jotebook-pair-card")
        .first();
      await destinationCard.waitFor({ timeout: 10_000 });

      // Expand the timestamp and content-comparison evidence.
      const detailsButton = destinationCard.getByRole("button", {
        name: /^(?:Show|Hide) details$/,
        exact: true,
      });
      if ((await detailsButton.getAttribute("aria-expanded")) !== "true") {
        await pointDemoCursorAt({ page, locator: detailsButton });
        await detailsButton.click();
      }
      await destinationCard
        .getByRole("region", { name: "File details" })
        .waitFor({ timeout: 10_000 });
      await pause(1_500);

      // Show the complete source and destination report before acting on it.
      await removeDemoCursorOverlay({ page });
      await scrollThroughWebview(reportFrame);

      // Show the destructive-action explanation, then cancel without changing
      // the prepared pair used by the rest of this scenario.
      const updateButton = destinationCard.getByRole("button", {
        name: /^Update .* from selected source$/,
      });
      await installDemoCursorOverlay({ page });
      await pointDemoCursorAt({ page, locator: updateButton });
      await updateButton.click();
      const confirmation = reportFrame.getByRole("dialog");
      await confirmation.waitFor({ timeout: 10_000 });
      await pause(1_500);
      const cancelButton = confirmation.getByRole("button", { name: "Cancel" });
      await pointDemoCursorAt({ page, locator: cancelButton });
      await cancelButton.click();
      await pause(950);

      // Refresh exercises the webview-to-extension request and report update.
      const refreshButton = reportFrame.getByRole("button", {
        name: "Refresh",
      });
      await pointDemoCursorAt({ page, locator: refreshButton });
      await refreshButton.click();
      await pause(1_500);
      const refreshedReportFrame = await findFrameByHeading(
        page,
        /Review paired files/i,
      );

      // Finish on the apples-to-apples normalized VS Code comparison.
      const refreshedCard = refreshedReportFrame
        .locator("#destinationList jotebook-pair-card")
        .first();
      const refreshedDetailsButton = refreshedCard.getByRole("button", {
        name: /^(?:Show|Hide) details$/,
        exact: true,
      });
      if (
        (await refreshedDetailsButton.getAttribute("aria-expanded")) !== "true"
      ) {
        await pointDemoCursorAt({ page, locator: refreshedDetailsButton });
        await refreshedDetailsButton.click();
      }
      const compareButton = refreshedCard.getByRole("button", {
        name: "Compare content",
      });
      await pointDemoCursorAt({ page, locator: compareButton });
      await compareButton.click();
      await removeDemoCursorOverlay({ page });
      await pause(4_000);
    },

    async verify({ page }) {
      await page
        .locator(".monaco-diff-editor, .diff-editor")
        .first()
        .waitFor({ timeout: 10_000 });
    },
  };
}
