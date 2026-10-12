import { describe, expect, it, vi } from "vitest";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  type ConsoleSurfaceActionContext,
  type ConsoleViewportService,
} from "@moyarich/console";
import {
  IMPERATIVE_SCROLLING_ADDON_ID,
  createImperativeScrollingAddon,
} from "@moyarich/console-addon-imperative-scrolling";

describe("@moyarich/console-addon-imperative-scrolling", () => {
  it("uses the package-qualified addon id", () => {
    expect(createImperativeScrollingAddon().id).toBe(
      IMPERATIVE_SCROLLING_ADDON_ID,
    );
    expect(IMPERATIVE_SCROLLING_ADDON_ID).toBe(
      "@moyarich/console-addon-imperative-scrolling",
    );
  });

  it("contributes standard actions backed by the core viewport service", () => {
    const manager = createConsoleAddonManager();
    const scrollToTop = vi.fn();
    const scrollToBottom = vi.fn();
    const focus = vi.fn();
    const viewport: ConsoleViewportService = {
      scrollToTop,
      scrollToBottom,
      scrollToMessage: () => false,
      isAtBottom: () => false,
      isAtTop: () => false,
      focus,
    };

    manager.services.provide(consoleServices.viewport, viewport);
    manager.load(createImperativeScrollingAddon());

    const actions = manager.extensions.getAll(
      consoleExtensionPoints.panelAction,
    );
    const context: ConsoleSurfaceActionContext = {
      kind: "console",
      mode: "console",
      hasMessages: true,
    };

    expect(actions.map((action) => action.label)).toEqual([
      "Scroll to top",
      "Latest output",
      "Focus output",
    ]);

    for (const action of actions) {
      action.onSelect(context);
    }

    expect(scrollToTop).toHaveBeenCalledOnce();
    expect(scrollToBottom).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();

    expect(manager.unload(IMPERATIVE_SCROLLING_ADDON_ID)).toBe(true);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.panelAction),
    ).toEqual([]);
  });

  it("lets hosts disable individual standard actions", () => {
    const manager = createConsoleAddonManager();
    const viewport: ConsoleViewportService = {
      scrollToTop: () => undefined,
      scrollToBottom: () => undefined,
      scrollToMessage: () => false,
      isAtBottom: () => false,
      isAtTop: () => false,
      focus: () => undefined,
    };

    manager.services.provide(consoleServices.viewport, viewport);
    manager.load(
      createImperativeScrollingAddon({
        scrollToTopAction: false,
        focusAction: false,
      }),
    );

    const actions = manager.extensions.getAll(
      consoleExtensionPoints.panelAction,
    );

    expect(actions.map((action) => action.label)).toEqual(["Latest output"]);
  });

  it("requires the core viewport service", () => {
    const manager = createConsoleAddonManager();

    expect(() => manager.load(createImperativeScrollingAddon())).toThrow(
      /console\.viewport.*not available/,
    );
    expect(manager.has(IMPERATIVE_SCROLLING_ADDON_ID)).toBe(false);
  });
});
