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
