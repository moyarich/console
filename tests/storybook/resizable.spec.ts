import { expect, test } from "@playwright/test";

test("docked console resizes with keyboard, stays in its workspace, and restores", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=addons-resizable--dockable-editor-shell&viewMode=story",
  );
  const frame = page.locator(".console-resizable-frame");
  const vertical = page.locator('[data-console-resize-axis="vertical"]');
  await expect(vertical).toBeVisible();
  await vertical.press("ArrowUp");
  await expect(vertical).toHaveAttribute("aria-valuenow", "260");
  for (let index = 0; index < 12; index++)
    await vertical.press("Shift+ArrowUp");
  const bounds = await frame.boundingBox();
  const workspace = await frame.locator("..").boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
    workspace!.y + workspace!.height + 1,
  );
  for (const dock of ["right", "top", "left", "bottom"]) {
    await page
      .getByRole("button", { name: "Console actions", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Dock ${dock}`, exact: true })
      .click();
    await expect(
      page.getByText(`Docked to ${dock}`, { exact: true }),
    ).toBeVisible();
    await expect(frame).toHaveAttribute(
      "data-console-resize-direction",
      dock === "left" || dock === "right" ? "horizontal" : "vertical",
    );
  }
  await page
    .getByRole("button", { name: "Console actions", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Minimize console", exact: true })
    .click();
  await expect(frame).toHaveCount(0);
  await page
    .getByRole("button", { name: "Restore console", exact: true })
    .click();
  await expect(frame).toBeVisible();
  await expect(page.locator(".monaco-editor .view-lines")).toBeVisible();
  expect(errors).toEqual([]);
});

test("console adapts when its docked workspace becomes narrow", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=addons-resizable--dockable-editor-shell&viewMode=story",
  );
  await page
    .getByRole("button", { name: "Console actions", exact: true })
    .click();
  await page.getByRole("button", { name: "Dock right", exact: true }).click();
  await expect(
    page.getByText("Docked to right", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText("Docked to bottom", { exact: true }),
  ).toBeVisible();
  const bounds = await page.locator(".console-panel").boundingBox();
  expect(bounds!.width).toBeGreaterThan(300);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(
    page.getByText("Docked to right", { exact: true }),
  ).toBeVisible();
});

test("combined addon controls fit a narrow container on a wide screen", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=addons-all-addons--all-addons&viewMode=story",
  );
  await expect(page.getByText(/Session restored/)).toBeVisible();
  await page.locator("#storybook-root > div").evaluate((element) => {
    element.style.width = "280px";
  });
  const panel = page.locator(".console-panel").first();
  await expect
    .poll(() =>
      panel.evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true);
  const bounds = await panel.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(280);
  for (const control of [
    panel.getByRole("searchbox").first(),
    panel.getByRole("searchbox").last(),
    panel.getByRole("button", { name: "Console actions", exact: true }),
  ]) {
    const controlBounds = await control.boundingBox();
    expect(controlBounds!.x + controlBounds!.width).toBeLessThanOrEqual(
      bounds!.x + bounds!.width,
    );
  }
});
