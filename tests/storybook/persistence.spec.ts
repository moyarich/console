import { expect, test } from "@playwright/test";

// Resolve IDs from Storybook's own index: acronym names such as SQLite can
// be normalized differently from a manually constructed URL.
async function story(page: import("@playwright/test").Page, name: string) {
  const response = await page.request.get("/index.json");
  expect(response.ok()).toBeTruthy();
  const index = (await response.json()) as {
    entries: Record<string, { id: string; title: string; name: string; type: string }>;
  };
  const entry = Object.values(index.entries).find(
    (item) => item.type === "story" && item.title === "Addons/Persistence" && item.name.toLowerCase() === name,
  );
  expect(entry, `Missing Storybook persistence story: ${name}`).toBeDefined();
  return `/iframe.html?id=${entry!.id}&viewMode=story`;
}

for (const name of ["memory", "stream", "file", "sqlite"]) {
  test(`${name} persistence example displays starter messages`, async ({ page }) => {
    await page.goto(await story(page, name));
    await expect(page.getByText("Persistence example ready").first()).toBeVisible();
    await expect(page.getByText("Initial sample message").first()).toBeVisible();
  });
}

test("memory persistence captures initial and added messages", async ({ page }) => {
  await page.goto(await story(page, "memory"));
  const output = page.getByLabel("Persisted JSON");
  await expect(output).toContainText("Initial sample message");
  await page.getByRole("button", { name: "Log event" }).click();
  await expect(output).toContainText("Persisted message 3");
});

test("stream persistence captures initial and added messages", async ({ page }) => {
  await page.goto(await story(page, "stream"));
  const output = page.getByLabel("WritableStream NDJSON output");
  await expect(output).toContainText("Initial sample message");
  await page.getByRole("button", { name: "Write stream" }).click();
  await expect(output).toContainText("Stream event 3");
});

test("file persistence writes through the local Storybook endpoint", async ({ page }) => {
  await page.goto(await story(page, "file"));
  await page.getByRole("button", { name: "Write file log" }).click();
  await expect(page.getByRole("status")).toContainText("Wrote");
});

test("sqlite persistence initializes before capturing starter messages", async ({ page }) => {
  await page.goto(await story(page, "sqlite"));
  await expect(page.getByRole("button", { name: "Write SQLite log" })).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("rows persisted");
  await page.getByRole("button", { name: "Write SQLite log" }).click();
  await expect(page.getByText("SQLite event 3")).toBeVisible();
});
