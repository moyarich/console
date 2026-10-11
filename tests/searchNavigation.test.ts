import { describe, expect, it } from "vitest";
import {
  consoleServices,
  createConsoleAddonManager,
  type ConsoleDataService,
  type ConsoleMessageData,
  type ConsoleViewportService,
} from "@moyarich/console-core";
import { createConsoleSearchAddon, consoleSearchService } from "@moyarich/console-addon-search";

describe("search navigation and filtering", () => {
  it("navigates repeated occurrences and keeps the selected occurrence after refresh", () => {
    const messages: ConsoleMessageData[] = [
      { id: "one", method: "log", data: ["error, error"], depth: 0 },
      { id: "two", method: "log", data: ["error"], depth: 0 },
    ];
    let visible = messages;
    const scrolled: string[] = [];
    const manager = createConsoleAddonManager();
    const data: ConsoleDataService = {
      getSnapshot: () => ({ mode: "console", all: messages, visible }),
      subscribe: () => ({ dispose() {} }),
    };
    const viewport: ConsoleViewportService = {
      scrollToMessage: (id) => { scrolled.push(id); return true; },
      scrollToTop() {},
      scrollToBottom() {},
      isAtBottom: () => false,
      isAtTop: () => false,
      focus() {},
    };
    manager.services.provide(consoleServices.data, data);
    manager.services.provide(consoleServices.viewport, viewport);
    const addon = createConsoleSearchAddon();
    manager.load(addon);
    expect(manager.services.get(consoleSearchService)).toBe(addon.controller);
    addon.controller.setQuery("error");
    expect(addon.controller.getState().matches).toHaveLength(3);
    expect(addon.controller.next()?.start).toBe(5);
    expect(addon.controller.next()?.start).toBe(12);
    addon.controller.refresh();
    expect(addon.controller.getState().activeIndex).toBe(1);
    expect(scrolled).toEqual(["one", "one"]);
    visible = [messages[1]!];
    addon.controller.refresh();
    expect(addon.controller.getState().matches).toHaveLength(1);
    expect(addon.controller.getState().activeIndex).toBe(-1);
  });
});
