import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Console,
  consoleCapabilities,
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  createConsoleCapability,
  createConsoleExtensionPoint,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleViewportService,
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

  it("exposes a typed built-in viewport service token", () => {
    const manager = createConsoleAddonManager();
    const viewport: ConsoleViewportService = {
      scrollToTop: () => undefined,
      scrollToBottom: () => undefined,
      scrollToMessage: () => false,
      isAtBottom: () => true,
      isAtTop: () => false,
      focus: () => undefined,
    };

    manager.services.provide(consoleServices.viewport, viewport);

    expect(manager.services.require(consoleServices.viewport)).toBe(viewport);
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

  it("renders typed panel actions in the header actions menu", () => {
    const markup = renderToStaticMarkup(
      <Console
        messages={[
          {
            id: "panel-action-message",
            method: "log",
            data: ["ready"],
            depth: 0,
          },
        ]}
        panelActions={[
          {
            id: "export-output",
            label: "Export output",
            disabled: ({ hasMessages }) => !hasMessages,
            onSelect: () => undefined,
          },
        ]}
      />,
    );

    expect(markup).toContain("Export output");
    expect(markup).toContain("console-panel-action");
  });

  it("exposes panel actions as an addon extension point", () => {
    const manager = createConsoleAddonManager();
    const action = {
      id: "addon-panel-action",
      label: "Addon action",
      onSelect: () => undefined,
    };

    manager.extensions.register(consoleExtensionPoints.panelAction, action);

    expect(
      manager.extensions.getAll(consoleExtensionPoints.panelAction),
    ).toEqual([action]);
  });

  it("allows an output renderer to replace the built-in structured surface", () => {
    const markup = renderToStaticMarkup(
      <Console
        messages={[
          {
            id: "structured",
            method: "log",
            data: ["hello", { ready: true }],
            depth: 0,
          },
        ]}
        showHeader={false}
        outputRenderers={[
          {
            mode: "console",
            render: (context) => {
              if (context.mode !== "console") return undefined;

              return (
                <div data-testid="custom-console-feed">
                  messages:{context.messages.length}
                </div>
              );
            },
          },
        ]}
      />,
    );

    expect(markup).toContain('data-testid="custom-console-feed"');
    expect(markup).toContain("messages:1");
    expect(markup).not.toContain("hello");
  });

  it("keeps the resizable console frame around a replaced output surface", () => {
    const markup = renderToStaticMarkup(
      <Console
        messages={[
          {
            id: "resizable-custom-surface",
            method: "log",
            data: ["source message"],
            depth: 0,
          },
        ]}
        resizable="both"
        outputRenderers={[
          {
            mode: "console",
            render: (context) => {
              if (context.mode !== "console") return undefined;

              return <div data-testid="custom-resizable-surface">custom</div>;
            },
          },
        ]}
      />,
    );

    expect(markup).toContain('data-resizable="both"');
    expect(markup).toContain('data-testid="custom-resizable-surface"');
    expect(markup).toContain('class="console-surface"');
  });

  it("falls back to the built-in structured surface when output renderers delegate", () => {
    const markup = renderToStaticMarkup(
      <Console
        messages={[
          {
            id: "structured-default",
            method: "log",
            data: ["built-in structured output"],
            depth: 0,
          },
        ]}
        showHeader={false}
        outputRenderers={[
          {
            mode: "console",
            render: () => undefined,
          },
        ]}
      />,
    );

    expect(markup).toContain("built-in structured output");
  });

  it("allows an output renderer to replace the built-in ANSI surface", () => {
    const markup = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={[]}
        showHeader={false}
        outputRenderers={[
          {
            mode: "ansi",
            render: (context) => {
              if (context.mode !== "ansi") return undefined;

              return (
                <div data-testid="custom-terminal">
                  terminal:{context.entries.length}
                </div>
              );
            },
          },
        ]}
      />,
    );

    expect(markup).toContain('data-testid="custom-terminal"');
    expect(markup).toContain("terminal:0");
    expect(markup).not.toContain("No process output yet.");
  });

  it("falls back to the built-in ANSI surface when output renderers delegate", () => {
    const markup = renderToStaticMarkup(
      <Console
        mode="ansi"
        messages={["hello from stdout"]}
        showHeader={false}
        outputRenderers={[
          {
            mode: "ansi",
            render: () => undefined,
          },
        ]}
      />,
    );

    expect(markup).toContain("hello from stdout");
  });

  it("exposes the output renderer as an addon extension point", () => {
    const manager = createConsoleAddonManager();
    const renderer = {
      mode: "ansi" as const,
      render: () => <div>terminal surface</div>,
    };

    manager.extensions.register(
      consoleExtensionPoints.outputRenderer,
      renderer,
    );

    expect(
      manager.extensions.getAll(consoleExtensionPoints.outputRenderer),
    ).toEqual([renderer]);
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
