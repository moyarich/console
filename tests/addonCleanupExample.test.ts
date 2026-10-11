import { expect, it } from "vitest";
import { createConsoleAddonManager } from "@moyarich/console-core";
import { createCleanupAddon } from "../packages/console-core/examples/01-addon-sdk/06-addon-cleanup/example";

it("aborts the example's listener on unload and registers a fresh listener on reload", () => {
  const manager = createConsoleAddonManager();
  const target = new EventTarget();
  let received = 0;
  const addon = createCleanupAddon(target, () => received++);
  manager.load(addon);
  target.dispatchEvent(new Event("sample"));
  expect(received).toBe(1);
  manager.unload(addon.id);
  target.dispatchEvent(new Event("sample"));
  expect(received).toBe(1);
  manager.load(addon);
  target.dispatchEvent(new Event("sample"));
  expect(received).toBe(2);
  manager.dispose();
  manager.dispose();
  target.dispatchEvent(new Event("sample"));
  expect(received).toBe(2);
});
