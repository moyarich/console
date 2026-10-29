import { expect, test } from "@playwright/test";

const story = (name: string) => `/iframe.html?id=addons-persistence--${name}&viewMode=story`;

for (const name of ["memory", "stream", "file", "sqlite"]) {
  test(`${name} persistence example displays starter messages`, async ({ page }) => {
    await page.goto(story(name));
    await expect(page.getByText("Persistence example ready")).toBeVisible();
    await expect(page.getByText("Initial sample message")).toBeVisible();
  });
}

test("memory persistence captures initial and added messages", async ({ page }) => {
  await page.goto(story("memory"));
  const output = page.getByLabel("Persisted JSON");
  await expect(output).toContainText("Initial sample message");
  await page.getByRole("button", { name: "Log event" }).click();
  await expect(output).toContainText("Persisted message 3");
});

test("stream persistence captures initial and added messages", async ({ page }) => {
  await page.goto(story("stream"));
  const output = page.getByLabel("WritableStream NDJSON output");
  await expect(output).toContainText("Initial sample message");
  await page.getByRole("button", { name: "Write stream" }).click();
  await expect(output).toContainText("Stream event 3");
});

test("file persistence writes through the local Storybook endpoint", async ({ page }) => {
  await page.goto(story("file"));
  await page.getByRole("button", { name: "Write file log" }).click();
  await expect(page.getByRole("status")).toContainText("Wrote");
});

test("sqlite persistence initializes before capturing starter messages", async ({ page }) => {
  await page.goto(story("sqlite"));
  await expect(page.getByRole("button", { name: "Write SQLite log" })).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("rows persisted");
  await page.getByRole("button", { name: "Write SQLite log" }).click();
  await expect(page.getByText("SQLite event 3")).toBeVisible();
});
