import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console, consoleExtensionPoints, createConsoleAddonManager } from "@moyarich/console";
import { createConsoleAnimationAddon, getConsoleAnimationDelay } from "@moyarich/console-addon-animation";

describe("animated output addon", () => {
  it("calculates nonnegative sequencing delays", () => {
    expect(getConsoleAnimationDelay(2, { wait: 0.5, stagger: 0.1 })).toBeCloseTo(0.7);
    expect(getConsoleAnimationDelay(-1, { wait: -1, stagger: -2 })).toBe(0);
  });
  it("registers and disposes per-entry middleware", () => {
    const manager = createConsoleAddonManager();
    const disposable = manager.load(createConsoleAnimationAddon({ effect: "typewriter" }));
    expect(manager.extensions.getAll(consoleExtensionPoints.outputEntryDecorator)).toHaveLength(1);
    disposable.dispose();
    expect(manager.extensions.getAll(consoleExtensionPoints.outputEntryDecorator)).toHaveLength(0);
  });
  it("preserves structured output content and IDs", () => {
    const html = renderToStaticMarkup(<Console addons={[createConsoleAnimationAddon()]} messages={[{ id: "first", method: "log", data: [{ hello: "world" }], depth: 0 }]} />);
    expect(html).toContain('data-console-message-id="first"');
    expect(html).toContain("hello");
  });
  it("preserves terminal ANSI rows, links, and IDs", () => {
    const html = renderToStaticMarkup(<Console mode="terminal" addons={[createConsoleAnimationAddon({ effect: "typewriter" })]} messages={[{ id: "run", stream: "stdout", data: "\u001b[31mfailed\u001b[0m https://example.com" }]} />);
    expect(html).toContain('data-console-message-id="run"');
    expect(html).toContain("failed");
    expect(html).toContain("example.com");
  });
});
