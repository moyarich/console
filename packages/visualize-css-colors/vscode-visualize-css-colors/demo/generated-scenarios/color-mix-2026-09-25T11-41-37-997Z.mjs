import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.getByRole("tree", { name: "Files Explorer" }).click();
  await page.locator(".monaco-icon-label-container").first().click();
  //await page.getByRole('textbox', { name: 'The editor is not accessible' }).click();
  await page.locator(".strip.hue-strip").click();
  await page
    .getByRole("tooltip", { name: " #00d96d" })
    .locator("canvas")
    .click({
      position: {
        x: 223,
        y: 72,
      },
    });
  //await page.getByRole('textbox', { name: 'The editor is not accessible' }).click();
  await page.getByTestId("color-swatch-1").click();
  await page.getByTestId("color-swatch-1").click();
  await page
    .locator("div")
    .filter({ hasText: /^#00ff00$/ })
    .nth(5)
    .click();
  await page
    .getByRole("tooltip", { name: " #1500ff" })
    .locator("canvas")
    .click({
      position: {
        x: 215,
        y: 25,
      },
    });
  await page
    .getByRole("tooltip", { name: " #2211d5" })
    .locator("canvas")
    .click({
      position: {
        x: 215,
        y: 3,
      },
    });
  await page
    .locator("div")
    .filter({ hasText: /^#2714f9$/ })
    .nth(5)
    .press("Enter");
  await page
    .getByRole("tooltip", { name: " #2714f9" })
    .locator("canvas")
    .click({
      position: {
        x: 209,
        y: 16,
      },
    });
  await page
    .locator("div")
    .filter({ hasText: /^#2918e4$/ })
    .nth(5)
    .press("Enter");
  await page
    .getByRole("textbox", { name: "The editor is not accessible" })
    .click();
  await page.getByTestId("color-swatch-2").click();
  await page.getByTestId("color-swatch-2").click();
  await page.locator(".view-lines > div:nth-child(6)").click();
  await page.getByText(":root { --mix: #068445; --hue").click();
  await page.getByText("1ExplorerDrag a view here to").click();
  await page.getByText(":root { --mix: #068445; --hue").click();
});
