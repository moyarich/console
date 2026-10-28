import { expect, test } from "@playwright/test";

test("long structured and terminal output can wrap or scroll without truncation", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-messages--output-overflow&viewMode=story",
  );
  const surface = page.locator(".console-surface");
  const fits = () =>
    surface.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    );
  await expect(page.locator(".console-object-preview")).toHaveCSS(
    "text-overflow",
    "clip",
  );
  for (const terminal of [false, true]) {
    await page
      .getByLabel("Terminal output", { exact: true })
      .setChecked(terminal);
    await page.getByLabel("Long lines").selectOption("wrap");
    await expect.poll(fits).toBe(true);
    await page.getByLabel("Long lines").selectOption("scroll");
    await expect.poll(fits).toBe(false);
    await expect(page.locator(".console-panel")).toHaveAttribute(
      "data-console-output-overflow",
      "scroll",
    );
  }
});
