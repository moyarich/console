import { expect, test } from "@playwright/test";

test("playground and Storybook share an origin with live connections", async ({
  page,
}) => {
  const errors: string[] = [];
  const connected = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => {
    const path = new URL(socket.url()).pathname;
    socket.on("framereceived", ({ payload }) => {
      if (String(payload).includes('"type":"connected"')) connected.add(path);
    });
  });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Site navigation" })
    .getByRole("link", { name: "Storybook", exact: true })
    .click();
  await expect(page).toHaveURL(/localhost:5173\/storybook\//);
  await page.goto("/storybook?path=/story/addons-all-addons--all-addons");
  await expect(page).toHaveURL(/\/storybook\/\?path=/);
  await expect(
    page
      .frameLocator("#storybook-preview-iframe")
      .getByText(/Session restored/),
  ).toBeVisible();
  await expect
    .poll(() => connected.has("/") && connected.has("/storybook/hmr"))
    .toBe(true);
  await page.getByRole("link", { name: "← Playground", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Site navigation" }),
  ).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
  expect(errors).toEqual([]);
});
