import { expect, test } from "@playwright/test";

test("addon lifecycle notifies only changed synchronous generations", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-lifecycle--addon-events&viewMode=story",
  );
  const output = page.getByLabel("Addon lifecycle events");
  await expect(output).toHaveText("console:example");

  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(output).toHaveText("console:example | console:none");

  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(output).toHaveText(
    "console:example | console:none | console:example",
  );

  await page.getByRole("button", { name: "Replace addon" }).click();
  await expect(output).toHaveText(
    "console:example | console:none | console:example | console:example",
  );
});

test("addon activation errors do not report ready and healthy addons remain active", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-lifecycle--addon-events&viewMode=story",
  );
  const output = page.getByLabel("Addon lifecycle events");
  await expect(output).toHaveText("console:example");

  await page.getByRole("button", { name: "Toggle failing addon" }).click();
  await expect(output).toContainText(
    "error:failing:activate:Error: activation failed",
  );
  await expect(output).not.toContainText("console:example | console:example");

  await page.getByRole("button", { name: "Replace addon" }).click();
  await expect(output).toHaveText(
    "console:example | error:failing:activate:Error: activation failed",
  );
  await page.getByRole("button", { name: "Toggle failing addon" }).click();
  await expect(output).toHaveText(
    "console:example | error:failing:activate:Error: activation failed | console:example",
  );
});

test("addon disposal errors are isolated and reported without ready notification", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-lifecycle--addon-events&viewMode=story",
  );
  const output = page.getByLabel("Addon lifecycle events");
  await page.getByRole("button", { name: "Toggle disposal addon" }).click();
  await expect(output).toHaveText("console:example | console:example,disposal");
  await page.getByRole("button", { name: "Toggle disposal addon" }).click();
  await expect(output).toHaveText(
    "console:example | console:example,disposal | error:disposal:dispose:Error: disposal failed",
  );
});

test("scoped lifecycle observer receives activation and disposal errors exactly once", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-lifecycle--addon-events&viewMode=story",
  );
  const scoped = page.getByLabel("Scoped addon errors");
  await expect(scoped).toBeEmpty();
  await page.getByRole("button", { name: "Toggle failing addon" }).click();
  await expect(scoped).toHaveText(
    "addon-activate:failing:Error: activation failed",
  );
  await page.getByRole("button", { name: "Replace addon" }).click();
  await expect(scoped).toHaveText(
    "addon-activate:failing:Error: activation failed",
  );
  await page.getByRole("button", { name: "Toggle failing addon" }).click();
  await page.getByRole("button", { name: "Toggle disposal addon" }).click();
  await page.getByRole("button", { name: "Toggle disposal addon" }).click();
  await expect(scoped).toHaveText(
    "addon-activate:failing:Error: activation failed | addon-dispose:disposal:Error: disposal failed",
  );
});

test("addon-owned service subscriptions are cleaned up on disable and identity replacement", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-lifecycle--addon-events&viewMode=story",
  );
  const subscriptions = page.getByLabel("Addon subscriptions");
  await expect(subscriptions).toHaveText("first:subscribe");
  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(subscriptions).toHaveText("first:subscribe | first:dispose");
  await page.getByRole("button", { name: "Toggle addon" }).click();
  await expect(subscriptions).toHaveText(
    "first:subscribe | first:dispose | first:subscribe",
  );
  await page.getByRole("button", { name: "Replace addon" }).click();
  await expect(subscriptions).toHaveText(
    "first:subscribe | first:dispose | first:subscribe | first:dispose | replacement:subscribe",
  );
});
