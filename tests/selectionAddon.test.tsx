import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  type ConsoleDataService,
  type ConsoleMessageData,
  type ConsoleStdoutEntry,
} from "@moyarich/console-core";
import {
  consoleSelectionService,
  createConsoleSelectionAddon,
  createConsoleSelectionController,
} from "@moyarich/console-addon-selection";

const messages: ConsoleMessageData[] = [
  { id: "a", method: "log", data: ["a"], depth: 0 },
  { id: "b", method: "warn", data: ["b"], depth: 0 },
  { id: "c", method: "error", data: ["c"], depth: 0 },
];

function structuredData(visible = messages): ConsoleDataService {
  return {
    getSnapshot: () => ({ mode: "console", all: messages, visible }),
    subscribe: () => ({ dispose() {} }),
  };
}

describe("@moyarich/console-addon-selection", () => {
  it("supports single, additive, toggle, remove, and clear selection", () => {
    const controller = createConsoleSelectionController();

    expect(controller.select("a")).toBe(true);
    expect(controller.getState().selectedIds).toEqual(["a"]);

    controller.select("b", true);
    expect(controller.getState().selectedIds).toEqual(["a", "b"]);

    expect(controller.toggle("a")).toBe(false);
    expect(controller.getState().selectedIds).toEqual(["b"]);

    expect(controller.toggle("c")).toBe(true);
    expect(controller.getState().selectedIds).toEqual(["b", "c"]);

    expect(controller.deselect("missing")).toBe(false);
    controller.clear();
    expect(controller.getState().selectedIds).toEqual([]);
  });

  it("selects ranges using the current visible structured order", () => {
    const controller = createConsoleSelectionController(() =>
      structuredData([messages[0]!, messages[2]!]),
    );

    expect(controller.selectRange("a", "c")).toEqual(["a", "c"]);
    expect(controller.getState().anchorId).toBe("c");
  });

  it("supports terminal/process entry IDs for semantic selection", () => {
    const entries: ConsoleStdoutEntry[] = [
      { id: "stdout-1", data: "one" },
      { id: "stdout-2", data: "two" },
      { id: "stderr-1", data: "three", stream: "stderr" },
    ];
    const data: ConsoleDataService = {
      getSnapshot: () => ({
        mode: "terminal",
        rawEntries: entries,
        all: entries.map((entry) => ({
          entry,
          output: {
            text: entry.data,
            data: entry.data,
            metadata: {},
          },
        })),
        visible: entries.map((entry) => ({
          entry,
          output: {
            text: entry.data,
            data: entry.data,
            metadata: {},
          },
        })),
      }),
      subscribe: () => ({ dispose() {} }),
    };
    const controller = createConsoleSelectionController(() => data);

    expect(controller.selectRange("stdout-1", "stderr-1")).toEqual([
      "stdout-1",
      "stdout-2",
      "stderr-1",
    ]);
  });

  it("preserves hidden selected IDs while exposing visible selected IDs", () => {
    let visible = messages;
    const data: ConsoleDataService = {
      getSnapshot: () => ({ mode: "console", all: messages, visible }),
      subscribe: () => ({ dispose() {} }),
    };
    const controller = createConsoleSelectionController(() => data);

    controller.setSelectedIds(["a", "c"]);
    visible = [messages[0]!];

    expect(controller.getState().selectedIds).toEqual(["a", "c"]);
    expect(controller.getVisibleSelectedIds()).toEqual(["a"]);
  });

  it("registers a service, message action, and selected decoration", () => {
    const manager = createConsoleAddonManager();
    manager.services.provide(consoleServices.data, structuredData());

    const addon = createConsoleSelectionAddon();
    manager.load(addon);

    expect(manager.services.get(consoleSelectionService)).toBe(
      addon.controller,
    );

    const action = manager.extensions.getAll(
      consoleExtensionPoints.messageAction,
    )[0]!;
    action.onSelect({
      kind: "message",
      mode: "console",
      hasMessages: true,
      message: messages[1]!,
      index: 1,
      messages,
    });

    expect(addon.controller.isSelected("b")).toBe(true);

    const decoration = manager.extensions.getAll(
      consoleExtensionPoints.messageDecoration,
    )[0]!;
    const markup = renderToStaticMarkup(
      decoration.render({
        message: messages[1]!,
        index: 1,
        messages,
        placement: "gutter",
      }) as React.ReactElement,
    );

    expect(markup).toContain("Selected message");
    expect(markup).toContain("●");
  });
});
