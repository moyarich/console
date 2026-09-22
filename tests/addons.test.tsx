import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Console,
  consoleCapabilities,
  consoleExtensionPoints,
  createConsoleAddonManager,
  createConsoleCapability,
  createConsoleExtensionPoint,
  createConsoleServiceToken,
  type ConsoleAddon,
} from "@moyarich/console";

describe("console addon API", () => {
  it("orders extension contributions by priority then registration order", () => {
    const manager = createConsoleAddonManager();
    const point = createConsoleExtensionPoint<string>("test.extension");

    const first = manager.extensions.register(point, "first");
    manager.extensions.register(point, "high", { priority: 10 });
    manager.extensions.register(point, "second");

    expect(manager.extensions.getAll(point)).toEqual([
      "high",
      "first",
      "second",
    ]);

    first.dispose();

    expect(manager.extensions.getAll(point)).toEqual(["high", "second"]);
  });

  it("provides single-provider typed services", () => {
    const manager = createConsoleAddonManager();
    const token = createConsoleServiceToken<{ name: string }>("test.service");
    const service = { name: "primary" };
    const registration = manager.services.provide(token, service);

    expect(manager.services.has(token)).toBe(true);
    expect(manager.services.get(token)).toBe(service);
    expect(manager.services.require(token)).toBe(service);
    expect(() =>
      manager.services.provide(token, { name: "duplicate" }),
    ).toThrow(/already has a provider/);

    registration.dispose();

    expect(manager.services.has(token)).toBe(false);
    expect(manager.services.get(token)).toBeUndefined();
    expect(() => manager.services.require(token)).toThrow(/not available/);
  });

  it("exposes declared capabilities without coupling addons to mode internals", () => {
    const custom = createConsoleCapability("test.custom");
    const manager = createConsoleAddonManager({
      capabilities: [consoleCapabilities.structuredMessages, custom],
    });

    expect(
      manager.capabilities.has(consoleCapabilities.structuredMessages),
    ).toBe(true);
    expect(manager.capabilities.has(consoleCapabilities.processOutput)).toBe(
      false,
    );
    expect(manager.capabilities.has(custom)).toBe(true);
    expect(manager.capabilities.getAll()).toEqual([
      consoleCapabilities.structuredMessages,
      custom,
    ]);
  });

  it("automatically removes addon extensions and services on unload", () => {
    const manager = createConsoleAddonManager({
      capabilities: [consoleCapabilities.structuredMessages],
    });
    const point = createConsoleExtensionPoint<string>("test.scoped");
    const token = createConsoleServiceToken<{
      name: string;
      dispose(): void;
    }>("test.scoped-service");
    const cleanup: string[] = [];

    const addon: ConsoleAddon = {
      id: "scoped-addon",
      activate(host) {
        expect(
          host.capabilities.has(consoleCapabilities.structuredMessages),
        ).toBe(true);

        host.extensions.register(point, "from-addon");
        host.services.provide(token, {
          name: "service",
          dispose: () => cleanup.push("service"),
        });
        host.scope.defer(() => cleanup.push("scope"));

        return () => cleanup.push("activate");
      },
    };

    const registration = manager.load(addon);

    expect(manager.has("scoped-addon")).toBe(true);
    expect(manager.extensions.getAll(point)).toEqual(["from-addon"]);
    expect(manager.services.require(token).name).toBe("service");

    registration.dispose();
    registration.dispose();

    expect(manager.has("scoped-addon")).toBe(false);
    expect(manager.extensions.getAll(point)).toEqual([]);
    expect(manager.services.get(token)).toBeUndefined();
    expect(cleanup).toEqual(["activate", "scope", "service"]);
  });

  it("allows an addon to reload after scoped unload", () => {
    const manager = createConsoleAddonManager();
    const point = createConsoleExtensionPoint<string>("test.replay");
    let activations = 0;

    const addon: ConsoleAddon = {
      id: "strict-mode-addon",
      activate(host) {
        activations += 1;
        host.extensions.register(point, `activation-${activations}`);
      },
    };

    const first = manager.load(addon);

    expect(manager.extensions.getAll(point)).toEqual(["activation-1"]);

    first.dispose();

    expect(manager.has(addon.id)).toBe(false);
    expect(manager.extensions.getAll(point)).toEqual([]);

    const second = manager.load(addon);

    expect(manager.extensions.getAll(point)).toEqual(["activation-2"]);

    second.dispose();
  });

  it("rejects duplicate addon and extension registration IDs", () => {
    const manager = createConsoleAddonManager();
    const point = createConsoleExtensionPoint<string>("test.ids");

    manager.extensions.register(point, "one", { id: "same" });

    expect(() =>
      manager.extensions.register(point, "two", { id: "same" }),
    ).toThrow(/already registered/);

    const addon: ConsoleAddon = {
      id: "same-addon",
      activate: () => undefined,
    };

    manager.load(addon);

    expect(() =>
      manager.load({
        id: "same-addon",
        activate: () => undefined,
      }),
    ).toThrow(/already loaded/);
  });

  it("disposes loaded addons in reverse activation order", () => {
    const manager = createConsoleAddonManager();
    const cleanup: string[] = [];

    manager.load({
      id: "first",
      activate: () => () => cleanup.push("first"),
    });
    manager.load({
      id: "second",
      activate: () => () => cleanup.push("second"),
    });

    manager.dispose();
    manager.dispose();

    expect(cleanup).toEqual(["second", "first"]);
    expect(() =>
      manager.load({
        id: "late",
        activate: () => undefined,
      }),
    ).toThrow(/manager is disposed/);
  });

  it("exposes current console hook contracts as built-in extension points", () => {
    const manager = createConsoleAddonManager();
    const provider = {
      id: "issue-links",
      provideLinks: () => undefined,
    };

    manager.extensions.register(consoleExtensionPoints.linkProvider, provider);

    expect(
      manager.extensions.getAll(consoleExtensionPoints.linkProvider),
    ).toEqual([provider]);
  });

  it("rejects duplicate addon IDs through the React Console API", () => {
    const addons: ConsoleAddon[] = [
      { id: "duplicate", activate: () => undefined },
      { id: "duplicate", activate: () => undefined },
    ];

    expect(() =>
      renderToStaticMarkup(<Console messages={[]} addons={addons} />),
    ).toThrow(/appears more than once/);
  });
});
