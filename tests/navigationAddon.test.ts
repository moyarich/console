import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  type ConsoleDataService,
  type ConsoleMessageData,
  type ConsoleViewportService,
} from "@moyarich/console-core";
import { createConsoleAnnotationsAddon } from "@moyarich/console-addon-annotations";
import {
  CONSOLE_NAVIGATION_ADDON_ID,
  consoleNavigationService,
  createConsoleNavigationAddon,
} from "@moyarich/console-addon-navigation";

const messages: ConsoleMessageData[] = [
  { id: "log-1", method: "log", data: ["one"], depth: 0 },
  { id: "warn-1", method: "warn", data: ["warn"], depth: 0 },
  { id: "error-1", method: "error", data: ["error"], depth: 0 },
  { id: "error-2", method: "error", data: ["error two"], depth: 0 },
];

function setup(visible = messages) {
  const manager = createConsoleAddonManager();
  const scrolled: string[] = [];
  const data: ConsoleDataService = {
    getSnapshot: () => ({ mode: "console", all: messages, visible }),
    subscribe: () => ({ dispose() {} }),
  };
  const viewport: ConsoleViewportService = {
    scrollToTop() {},
    scrollToBottom() {},
    scrollToMessage(id) {
      scrolled.push(id);
      return true;
    },
    isAtBottom: () => false,
    isAtTop: () => false,
    focus() {},
  };

  manager.services.provide(consoleServices.data, data);
  manager.services.provide(consoleServices.viewport, viewport);

  return { manager, scrolled };
}

describe("@moyarich/console-addon-navigation", () => {
  it("navigates visible errors and exposes boundary state", () => {
    const { manager, scrolled } = setup();
    const addon = createConsoleNavigationAddon();
    manager.load(addon);

    expect(addon.controller.nextError()).toBe("error-1");
    expect(addon.controller.nextError()).toBe("error-2");
    expect(addon.controller.nextError()).toBeUndefined();
    expect(addon.controller.getState()).toMatchObject({
      currentTargetId: "error-2",
      kind: "error",
      boundary: "end",
    });

    expect(addon.controller.previousError()).toBe("error-1");
    expect(scrolled).toEqual(["error-1", "error-2", "error-1"]);
  });

  it("uses the current visible/filtered set without changing source order", () => {
    const visible = [messages[0]!, messages[3]!];
    const { manager } = setup(visible);
    const addon = createConsoleNavigationAddon();
    manager.load(addon);

    expect(addon.controller.nextError()).toBe("error-2");
    expect(addon.controller.previousWarning()).toBeUndefined();
  });

  it("jumps to stable IDs only when they are visible", () => {
    const { manager, scrolled } = setup([messages[1]!, messages[2]!]);
    const addon = createConsoleNavigationAddon();
    manager.load(addon);

    expect(addon.controller.jumpToMessage("error-1")).toBe(true);
    expect(addon.controller.jumpToMessage("error-2")).toBe(false);
    expect(scrolled).toEqual(["error-1"]);
  });

  it("navigates annotations when the annotations service is available", () => {
    const { manager } = setup();
    const annotations = createConsoleAnnotationsAddon({
      decoration: false,
      bookmarkAction: false,
    });
    const navigation = createConsoleNavigationAddon();

    manager.load(annotations);
    manager.load(navigation);

    annotations.controller.addAnnotation("warn-1", {
      id: "bookmark",
      label: "Bookmark",
    });
    annotations.controller.addAnnotation("error-2", {
      id: "important",
      label: "Important",
    });

    expect(navigation.controller.nextAnnotated()).toBe("warn-1");
    expect(navigation.controller.nextAnnotated()).toBe("error-2");
  });

  it("registers keyboard shortcuts and a navigation service", () => {
    const { manager } = setup();
    const addon = createConsoleNavigationAddon();

    manager.load(addon);

    expect(manager.services.get(consoleNavigationService)).toBe(
      addon.controller,
    );
    expect(
      manager.extensions.getAll(consoleExtensionPoints.keyboardShortcut),
    ).toHaveLength(4);

    expect(manager.unload(CONSOLE_NAVIGATION_ADDON_ID)).toBe(true);
    expect(manager.services.get(consoleNavigationService)).toBeUndefined();
  });
});
