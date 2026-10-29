import { expect, test } from "@playwright/test";

for (const story of [
  "live-tqdm-redraw",
  "streaming-ansi",
  "empty-terminal",
  "pyodide-tqdm-browser-runtime",
]) {
  test(`${story} exposes working Console controls`, async ({ page }) => {
    await page.goto(`/?path=/story/console-terminal--${story}`);
    await page.getByRole("tab", { name: /^Controls/ }).click();
    const title = page.locator("#control-title");
    await expect(title).toBeVisible();
    await title.fill("Title set through Controls");
    await title.blur();
    await expect(
      page.frameLocator("#storybook-preview-iframe").getByRole("heading", {
        name: "Title set through Controls",
        exact: true,
      }),
    ).toBeVisible();
  });
}

for (const story of ["live-tqdm-redraw", "pyodide-tqdm-browser-runtime"]) {
  test(`${story} accepts editable initial messages`, async ({ page }) => {
    await page.goto(`/?path=/story/console-terminal--${story}`);
    await page.getByRole("tab", { name: /^Controls/ }).click();
    await page
      .getByRole("switch", { name: "Edit messages as JSON", exact: true })
      .click();
    const row = page
      .getByRole("row")
      .filter({ has: page.getByText("messages", { exact: true }) });
    await row
      .getByRole("textbox")
      .fill('["Output supplied through messages controls\\n"]');
    await row.getByRole("textbox").blur();
    const frame = page.frameLocator("#storybook-preview-iframe");
    await expect(
      frame.getByText("Output supplied through messages controls", {
        exact: false,
      }),
    ).toBeVisible();
    if (story === "live-tqdm-redraw") {
      await page.locator("#control-outputOverflow").selectOption("scroll");
      await expect(frame.locator(".console-panel")).toHaveAttribute(
        "data-console-output-overflow",
        "scroll",
      );
    }
  });
}

test("Console controls display documented defaults", async ({ page }) => {
  await page.goto("/?path=/story/console-terminal--live-tqdm-redraw");
  await page
    .frameLocator("#storybook-preview-iframe")
    .getByRole("heading", { name: "Live tqdm-style redraw", exact: true })
    .waitFor();
  await page.getByRole("tab", { name: /^Controls/ }).click();
  await expect(
    page.getByRole("columnheader", { name: "Default", exact: true }),
  ).toBeVisible();
  for (const [name, value] of [
    ["outputOverflow", '"wrap"'],
    ["autoScroll", "true"],
    ["showHeader", "true"],
    ["locale", '"en"'],
    ["dir", '"auto"'],
  ] as const) {
    const row = page
      .getByRole("row")
      .filter({ has: page.getByText(name, { exact: true }) });
    await expect(row.getByRole("cell").nth(2)).toHaveText(value);
  }
});
