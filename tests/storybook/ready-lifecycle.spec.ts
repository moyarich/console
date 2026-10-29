import { expect, test } from "@playwright/test";

test("ready reports each successful addon and mode generation", async ({ page }) => {
  await page.goto("/iframe.html?id=console-readylifecycle--ready-events&viewMode=story");
  const events = page.getByLabel("Ready events");
  await expect(events).toHaveText("ready:console:console");
  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(events).toHaveText("ready:console:console | ready:console:console");
  await page.getByRole("button", { name: "Switch mode" }).click();
  await expect(events).toHaveText("ready:console:console | ready:console:console | ready:terminal:terminal");
});
