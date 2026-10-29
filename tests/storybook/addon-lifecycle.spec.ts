import { expect, test } from "@playwright/test";

test("addon lifecycle notifies only changed synchronous generations", async ({ page }) => {
  await page.goto("/iframe.html?id=console-lifecycle--addon-events&viewMode=story");
  const output = page.getByLabel("Addon lifecycle events");
  await expect(output).toHaveText("console:example");

  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(output).toHaveText("console:example | console:none");

  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(output).toHaveText("console:example | console:none | console:example");

  await page.getByRole("button", { name: "Replace addon" }).click();
  await expect(output).toHaveText("console:example | console:none | console:example | console:example");
});
