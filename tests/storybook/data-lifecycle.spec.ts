import { expect, test } from "@playwright/test";

test("data lifecycle emits committed source changes without presentation-only duplicates", async ({ page }) => {
  await page.goto("/iframe.html?id=console-lifecycle--data-events&viewMode=story");
  const events = page.getByLabel("Data lifecycle events");
  await expect(events).toHaveText("messages:1");
  await page.getByRole("button", { name: "Toggle presentation" }).click();
  await expect(events).toHaveText("messages:1");
  await page.getByRole("button", { name: "Add message" }).click();
  await expect(events).toHaveText("messages:1, messages:2");
  await page.getByRole("button", { name: "Switch mode" }).click();
  await expect(events).toHaveText("messages:1, messages:2, output:1");
  await page.getByRole("button", { name: "Toggle presentation" }).click();
  await expect(events).toHaveText("messages:1, messages:2, output:1");
  await page.getByRole("button", { name: "Add terminal output" }).click();
  await expect(events).toHaveText("messages:1, messages:2, output:1, output:2");
  await page.getByRole("button", { name: "Clear input" }).click();
  await expect(events).toHaveText("messages:1, messages:2, output:1, output:2, output:0");
  await page.getByRole("button", { name: "Switch mode" }).click();
  await expect(events).toHaveText("messages:1, messages:2, output:1, output:2, output:0, messages:0");
});
