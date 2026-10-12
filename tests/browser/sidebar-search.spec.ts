import { expect, test } from "@playwright/test";

test("one documentation search finds pages across packages and hides unrelated pages", async ({
  page,
}, testInfo) => {
  await page.goto("/#/package-addons-console-feed/overview");
  const navigation = page.getByRole("navigation", {
    name: "Console documentation",
  });
  const search = navigation.getByRole("searchbox", {
    name: "Search documentation",
  });
  await expect(navigation.getByRole("searchbox")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Optional console feed" }),
  ).toBeVisible();

  await search.fill("ansi");
  const results = page.getByRole("region", {
    name: "Search results",
    exact: true,
  });
  await expect(
    results.getByRole("button", { name: "ANSI output", exact: false }),
  ).toBeVisible();
  const exportResult = results.getByRole("button", {
    name: "ANSI data export",
    exact: false,
  });
  await expect(exportResult).toBeVisible();
  await expect(
    results.getByRole("button", { name: "Maintainer Guide", exact: false }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Feed renderer", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Optional console feed" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/package-addons-console-feed\/overview$/);
  await page.screenshot({ path: testInfo.outputPath("global-search.jpg") });

  await exportResult.click();
  await expect(page).toHaveURL(
    /#\/package-addons-data-export\/data-export\/ansi$/,
  );
  await expect(search).toHaveValue("ansi");

  await search.fill("zzzznonexistentdocumentation");
  await expect(results.getByRole("status")).toHaveText("No matching pages");
  await expect(results.getByRole("button")).toHaveCount(0);

  await search.fill("");
  await expect(results).toHaveCount(0);
  await expect(
    navigation.getByRole("button", { name: "Feed renderer", exact: true }),
  ).toBeVisible();
  await expect(navigation.getByRole("searchbox")).toHaveCount(1);
});
