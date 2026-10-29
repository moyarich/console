import { expect, test } from "@playwright/test";

test("Console invokes onMount once, cleans up on unmount, and supports both modes", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=console-lifecycle--on-mount&viewMode=story");
  const events = page.getByLabel("Mount events");
  await expect(events).toHaveText("mounted");
  await page.getByRole("button", { name: "Switch mode" }).click();
  await expect(page.locator(".console-panel")).toHaveAttribute(
    "data-console-mode",
    "terminal",
  );
  await expect(events).toHaveText("mounted");
  await page.getByRole("button", { name: "Unmount Console" }).click();
  await expect(events).toHaveText("mounted, unmounted");
  await page.getByRole("button", { name: "Mount Console" }).click();
  await expect(events).toHaveText("mounted, unmounted, mounted");
});
