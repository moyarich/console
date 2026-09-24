import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  createConsoleAddonManager,
  type ConsoleMessageData,
} from "@moyarich/console";
import {
  CONSOLE_FILTERING_ADDON_ID,
  ConsoleFilteringControls,
  consoleFilteringService,
  createConsoleFilteringAddon,
  createConsoleFilteringController,
  createConsoleMessageFilter,
} from "@moyarich/console-addon-filtering";

const messages: ConsoleMessageData[] = [
  {
    id: "browser-log",
    method: "log",
    data: ["API ready"],
    depth: 0,
    source: "browser",
  },
  {
    id: "worker-warn",
    method: "warn",
    data: ["API latency", { durationMs: 640 }],
    depth: 0,
    source: "worker",
  },
  {
    id: "worker-error",
    method: "error",
    data: ["Database unavailable"],
    depth: 0,
    source: "worker",
  },
  {
    id: "worker-debug",
    method: "debug",
    data: ["API retry"],
    depth: 0,
    source: "worker",
  },
];

describe("@moyarich/console-addon-filtering", () => {
  it("uses the package-qualified addon id", () => {
    expect(createConsoleFilteringAddon().id).toBe(CONSOLE_FILTERING_ADDON_ID);
    expect(CONSOLE_FILTERING_ADDON_ID).toBe(
      "@moyarich/console-addon-filtering",
    );
  });

  it("combines method, text, and source criteria without mutating messages", () => {
    const before = structuredClone(messages);
    const filter = createConsoleMessageFilter({
      methods: ["warn", "error"],
      text: "api",
      sources: ["worker"],
    });

    const visible = messages.filter(filter);

    expect(visible.map((message) => message.id)).toEqual(["worker-warn"]);
    expect(messages).toEqual(before);
  });

  it("updates its contributed predicate when headless state changes", () => {
    const manager = createConsoleAddonManager();
    const addon = createConsoleFilteringAddon();

    manager.load(addon);
    expect(manager.services.get(consoleFilteringService)).toBe(
      addon.controller,
    );

    const initial = manager.extensions.getAll(
      consoleExtensionPoints.messageFilter,
    );
    expect(initial).toHaveLength(1);
    expect(messages.filter(initial[0]!).map((message) => message.id)).toEqual(
      messages.map((message) => message.id),
    );

    addon.controller.setState({
      methods: ["warn", "error"],
      text: "database",
      sources: ["worker"],
    });

    const updated = manager.extensions.getAll(
      consoleExtensionPoints.messageFilter,
    );
    expect(updated).toHaveLength(1);
    expect(messages.filter(updated[0]!).map((message) => message.id)).toEqual([
      "worker-error",
    ]);

    expect(manager.unload(CONSOLE_FILTERING_ADDON_ID)).toBe(true);
    expect(manager.services.get(consoleFilteringService)).toBeUndefined();
    expect(
      manager.extensions.getAll(consoleExtensionPoints.messageFilter),
    ).toEqual([]);
  });

  it("returns method state to unfiltered when every method is enabled", () => {
    const controller = createConsoleFilteringController();

    controller.setMethodEnabled("warn", false);
    expect(controller.getState().methods).not.toBeNull();

    controller.setMethodEnabled("warn", true);
    expect(controller.getState().methods).toBeNull();
  });

  it("supports host-owned filter controllers", () => {
    const controller = createConsoleFilteringController({
      methods: ["error"],
    });
    const addon = createConsoleFilteringAddon({ controller });

    expect(addon.controller).toBe(controller);
    expect(controller.matches(messages[2]!)).toBe(true);
    expect(controller.matches(messages[1]!)).toBe(false);

    controller.reset();
    expect(controller.matches(messages[1]!)).toBe(false);
  });

  it("renders reusable first-party controls with discovered sources", () => {
    const controller = createConsoleFilteringController();

    const markup = renderToStaticMarkup(
      <ConsoleFilteringControls controller={controller} messages={messages} />,
    );

    expect(markup).toContain('aria-label="Console filters"');
    expect(markup).toContain(">warn<");
    expect(markup).toContain('placeholder="Filter console output"');
    expect(markup).toContain(">browser<");
    expect(markup).toContain(">worker<");
  });
});
