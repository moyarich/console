const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  await page.getByRole("tree", { name: "Files Explorer" }).click();
  await page
    .getByRole("treeitem", { name: "mix.css" })
    .locator("a")
    .filter({ hasText: "mix.css" })
    .click();
  await page.getByTestId("color-swatch-0").click();
  await page
    .getByRole("tooltip", { name: " #a300d9" })
    .locator("canvas")
    .click({
      position: {
        x: 211,
        y: 15,
      },
    });
  await page.locator(".strip.hue-strip").click();
  await page
    .getByRole("tooltip", { name: " #16e52b" })
    .locator("canvas")
    .click({
      position: {
        x: 224,
        y: 51,
      },
    });
  await page
    .getByRole("textbox", { name: "The editor is not accessible" })
    .click();
  await page.getByText(":root { --mix: #07a917; --hue").click();
  await page.getByTestId("color-swatch-2").click();
  await page.locator(".strip.hue-strip > .slider").click();
  await page
    .getByRole("tooltip", { name: " #80c0b6" })
    .locator("canvas")
    .click({
      position: {
        x: 213,
        y: 17,
      },
    });
  await page.getByText(":root { --mix: #07a917; --hue").click();

  // ---------------------
  await context.close();
  await browser.close();
})();
