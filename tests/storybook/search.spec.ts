import { expect, test } from "@playwright/test";

test("search controls navigate matches with keyboard and report invalid patterns", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=addons-all-addons--all-addons&viewMode=story",
  );
  await expect(page.getByText(/Session restored/)).toBeVisible();
  const search = page.getByRole("region", {
    name: "Console search",
    exact: true,
  });
  const input = search.getByRole("searchbox");
  await expect(search.getByRole("status")).toBeEmpty();
  await expect(
    search.getByRole("button", { name: "Next search result" }),
  ).toBeDisabled();
  await input.fill("example");
  await expect(search.getByRole("status")).toHaveText("1 of 2 matches");
  await input.press("Enter");
  await expect(search.getByRole("status")).toHaveText("2 of 2 matches");
  await input.press("Shift+Enter");
  await expect(search.getByRole("status")).toHaveText("1 of 2 matches");
  await search.getByLabel("Case sensitive", { exact: true }).check();
  await expect(search.getByRole("status")).toHaveText("1 of 1 matches");
  await search.getByLabel("Regex", { exact: true }).check();
  await input.fill("[");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(search.getByRole("alert")).toBeVisible();
  await input.fill("Example");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(search.getByRole("alert")).toHaveCount(0);
});
