import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  createConsoleAddonManager,
  type ConsoleMessageData,
} from "@moyarich/console-core";
import {
  CONSOLE_ANNOTATIONS_ADDON_ID,
  CONSOLE_BOOKMARK_ANNOTATION_ID,
  consoleAnnotationsService,
  createConsoleAnnotationsAddon,
  createConsoleAnnotationsController,
} from "@moyarich/console-addon-annotations";

const message: ConsoleMessageData = {
  id: "message-1",
  method: "warn",
  data: ["Needs attention"],
  depth: 0,
};

describe("@moyarich/console-addon-annotations", () => {
  it("adds, removes, and toggles annotations without mutating messages", () => {
    const controller = createConsoleAnnotationsController();
    const before = structuredClone(message);

    expect(
      controller.addAnnotation(message.id!, {
        id: "reviewed",
        label: "Reviewed",
      }),
    ).toBe(true);
    expect(
      controller.addAnnotation(message.id!, {
        id: "owner",
        label: "Owned",
        metadata: { user: "mary" },
      }),
    ).toBe(true);

    expect(controller.getAnnotations(message.id!)).toHaveLength(2);
    expect(controller.hasAnnotation(message.id!, "reviewed")).toBe(true);
    expect(controller.removeAnnotation(message.id!, "missing")).toBe(false);

    expect(controller.toggleAnnotation(message.id!)).toBe(true);
    expect(
      controller.hasAnnotation(message.id!, CONSOLE_BOOKMARK_ANNOTATION_ID),
    ).toBe(true);
    expect(controller.toggleAnnotation(message.id!)).toBe(false);

    expect(message).toEqual(before);
  });

  it("handles empty and unknown IDs safely", () => {
    const controller = createConsoleAnnotationsController();

    expect(
      controller.addAnnotation("", { id: "bookmark", label: "Bookmark" }),
    ).toBe(false);
    expect(controller.removeAnnotation("unknown", "bookmark")).toBe(false);
    expect(controller.clearMessage("unknown")).toBe(false);
    expect(controller.getAnnotations("unknown")).toEqual([]);
  });

  it("exposes its controller service and reactive decoration", () => {
    const manager = createConsoleAddonManager();
    const addon = createConsoleAnnotationsAddon();

    manager.load(addon);

    expect(manager.services.get(consoleAnnotationsService)).toBe(
      addon.controller,
    );
    expect(
      manager.extensions.getAll(consoleExtensionPoints.messageDecoration),
    ).toHaveLength(1);

    addon.controller.addAnnotation(message.id!, {
      id: "bookmark",
      label: "Bookmark",
    });

    const decoration = manager.extensions.getAll(
      consoleExtensionPoints.messageDecoration,
    )[0]!;

    expect(
      decoration.match?.({
        message,
        index: 0,
        messages: [message],
        placement: "badge",
      }),
    ).toBe(true);

    const markup = renderToStaticMarkup(
      decoration.render({
        message,
        index: 0,
        messages: [message],
        placement: "badge",
      }) as React.ReactElement,
    );

    expect(markup).toContain("Annotations: Bookmark");
    expect(markup).toContain("★");

    expect(manager.unload(CONSOLE_ANNOTATIONS_ADDON_ID)).toBe(true);
    expect(manager.services.get(consoleAnnotationsService)).toBeUndefined();
  });

  it("registers a bookmark message action for stable IDs", () => {
    const manager = createConsoleAddonManager();
    const addon = createConsoleAnnotationsAddon();

    manager.load(addon);

    const action = manager.extensions.getAll(
      consoleExtensionPoints.messageAction,
    )[0]!;

    const visible =
      typeof action.visible === "function"
        ? action.visible({
            kind: "message",
            mode: "console",
            hasMessages: true,
            message,
            index: 0,
            messages: [message],
          })
        : action.visible;

    expect(visible).toBe(true);

    action.onSelect({
      kind: "message",
      mode: "console",
      hasMessages: true,
      message,
      index: 0,
      messages: [message],
    });

    expect(addon.controller.hasAnnotation(message.id!, "bookmark")).toBe(true);
  });
});
