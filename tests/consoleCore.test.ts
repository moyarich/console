import { describe, expect, it } from "vitest";
import {
  CONSOLE_ADDON_API_VERSION,
  createConsoleAddonManager,
  createConsoleCapability,
  createConsoleExtensionPoint,
  createConsoleServiceToken,
  type ConsoleAddon,
} from "@moyarich/console-core";

describe("@moyarich/console-core", () => {
  it("provides the headless addon runtime without console UI contracts", () => {
    expect(CONSOLE_ADDON_API_VERSION).toBe("1");

    const manager = createConsoleAddonManager({
      capabilities: [createConsoleCapability("test.capability")],
    });
    const serviceToken = createConsoleServiceToken<string>("test.service");
    const extensionPoint =
      createConsoleExtensionPoint<string>("test.extension");
    const addon: ConsoleAddon = {
      id: "test.addon",
      activate(host) {
        host.services.provide(serviceToken, "ready");
        host.extensions.register(extensionPoint, "later", { priority: 1 });
        host.extensions.register(extensionPoint, "first", { priority: 10 });
      },
    };

    manager.load(addon);

    expect(manager.services.require(serviceToken)).toBe("ready");
    expect(manager.extensions.getAll(extensionPoint)).toEqual([
      "first",
      "later",
    ]);

    expect(manager.unload(addon.id)).toBe(true);
    expect(manager.services.get(serviceToken)).toBeUndefined();
    expect(manager.extensions.getAll(extensionPoint)).toEqual([]);
  });

  it("rejects duplicate addon ids and disposes scoped resources", () => {
    const manager = createConsoleAddonManager();
    const disposed: string[] = [];
    const addon: ConsoleAddon = {
      id: "test.scoped-addon",
      activate(host) {
        host.scope.defer(() => disposed.push("scope"));
        return () => disposed.push("cleanup");
      },
    };

    manager.load(addon);
    expect(() => manager.load(addon)).toThrow(/already loaded/);

    manager.unload(addon.id);
    expect(disposed).toEqual(["cleanup", "scope"]);
  });
});
