import { isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  createConsoleAddonManager,
} from "@moyarich/console";
import {
  RESIZABLE_CONSOLE_ADDON_ID,
  createResizableConsoleAddon,
  resolveConsoleResizeAxes,
} from "@moyarich/console-addon-resizable";

describe("@moyarich/console-addon-resizable", () => {
  it("uses the package-qualified addon id", () => {
    expect(createResizableConsoleAddon().id).toBe(RESIZABLE_CONSOLE_ADDON_ID);
    expect(RESIZABLE_CONSOLE_ADDON_ID).toBe(
      "@moyarich/console-addon-resizable",
    );
  });

  it.each([
    ["horizontal", { horizontal: true, vertical: false }],
    ["inline", { horizontal: true, vertical: false }],
    ["vertical", { horizontal: false, vertical: true }],
    ["block", { horizontal: false, vertical: true }],
    ["both", { horizontal: true, vertical: true }],
  ] as const)("resolves %s resize axes", (direction, expected) => {
    expect(resolveConsoleResizeAxes(direction)).toEqual(expected);
  });

  it("contributes one frame decorator and removes it on unload", () => {
    const manager = createConsoleAddonManager();
    manager.load(
      createResizableConsoleAddon({
        direction: "horizontal",
        horizontalEdge: "start",
      }),
    );

    const decorators = manager.extensions.getAll(
      consoleExtensionPoints.frameDecorator,
    );

    expect(decorators).toHaveLength(1);

    const decorated = decorators[0]?.render({
      mode: "console",
      renderDefault: () => "default frame",
    });

    expect(isValidElement(decorated)).toBe(true);

    const markup = renderToStaticMarkup(decorated as ReactElement);
    expect(markup).toContain('data-console-resize-direction="horizontal"');
    expect(markup).toContain('data-console-resize-axis="horizontal"');
    expect(markup).not.toContain('data-console-resize-axis="vertical"');
    expect(markup).toContain("default frame");

    expect(manager.unload(RESIZABLE_CONSOLE_ADDON_ID)).toBe(true);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.frameDecorator),
    ).toEqual([]);
  });
});
