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

test("addon activation errors do not report ready and healthy addons remain active", async ({ page }) => {
  await page.goto("/iframe.html?id=console-lifecycle--addon-events&viewMode=story");
  const output = page.getByLabel("Addon lifecycle events");
  await expect(output).toHaveText("console:example");

  await page.getByRole("button", { name: "Toggle failing addon" }).click();
  await expect(output).toContainText("error:failing:activate:Error: activation failed");
  await expect(output).not.toContainText("console:example | console:example");

  await page.getByRole("button", { name: "Replace addon" }).click();
  await expect(output).toHaveText("console:example | error:failing:activate:Error: activation failed");
  await page.getByRole("button", { name: "Toggle failing addon" }).click();
  await expect(output).toHaveText("console:example | error:failing:activate:Error: activation failed | console:example");
});

test("addon disposal errors are isolated and reported without ready notification", async ({ page }) => {
  await page.goto("/iframe.html?id=console-lifecycle--addon-events&viewMode=story");
  const output = page.getByLabel("Addon lifecycle events");
  await page.getByRole("button", { name: "Toggle disposal addon" }).click();
  await expect(output).toHaveText("console:example | console:example,disposal");
  await page.getByRole("button", { name: "Toggle disposal addon" }).click();
  await expect(output).toHaveText("console:example | console:example,disposal | error:disposal:dispose:Error: disposal failed");
});
