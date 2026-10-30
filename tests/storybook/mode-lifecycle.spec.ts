import { expect, test } from "@playwright/test";

test("mode transition callback only fires for committed mode switches", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=console-lifecycle--data-events&viewMode=story",
  );
  const transitions = page.getByLabel("Mode transition events");
  await expect(transitions).toBeEmpty();

  await page.getByRole("button", { name: "Toggle presentation" }).click();
  await expect(transitions).toBeEmpty();

  await page.getByRole("button", { name: "Switch mode" }).click();
  await expect(transitions).toHaveText("console->terminal");

  await page.getByRole("button", { name: "Add terminal output" }).click();
  await expect(transitions).toHaveText("console->terminal");

  await page.getByRole("button", { name: "Switch mode" }).click();
  await expect(transitions).toHaveText("console->terminal, terminal->console");
});
