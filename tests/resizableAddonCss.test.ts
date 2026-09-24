import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const coreStyles = readFileSync(
  fileURLToPath(new URL("../packages/console/src/styles.css", import.meta.url)),
  "utf8",
);

const addonStyles = readFileSync(
  fileURLToPath(
    new URL("../packages/addons/resizable/src/styles.css", import.meta.url),
  ),
  "utf8",
);

describe("@moyarich/console-addon-resizable CSS ownership", () => {
  it("keeps resize-specific CSS out of the core console stylesheet", () => {
    expect(coreStyles).not.toContain("console-resizable");
    expect(coreStyles).not.toContain("console-resize-");
    expect(coreStyles).not.toContain("--console-resize-");
  });

  it("owns resize direction and size constraints in the addon stylesheet", () => {
    expect(addonStyles).toContain(
      '[data-console-resize-direction="horizontal"]',
    );
    expect(addonStyles).toContain(
      '[data-console-resize-direction="vertical"]',
    );
    expect(addonStyles).toContain('[data-console-resize-direction="both"]');
    expect(addonStyles).toContain('[data-console-resize-direction="inline"]');
    expect(addonStyles).toContain('[data-console-resize-direction="block"]');
    expect(addonStyles).toContain("var(--_console-resizable-min-width)");
    expect(addonStyles).toContain("var(--_console-resizable-max-width)");
    expect(addonStyles).toContain("var(--_console-resizable-min-height)");
    expect(addonStyles).toContain("var(--_console-resizable-max-height)");
  });

  it("owns edge placement and themeable grips in the addon stylesheet", () => {
    expect(addonStyles).toContain(
      '[data-console-resize-horizontal-edge="start"]',
    );
    expect(addonStyles).toContain(
      '[data-console-resize-horizontal-edge="end"]',
    );
    expect(addonStyles).toContain(
      '[data-console-resize-vertical-edge="start"]',
    );
    expect(addonStyles).toContain(
      '[data-console-resize-vertical-edge="end"]',
    );
    expect(addonStyles).toContain(
      "--console-resize-separator-grip-background-color",
    );
    expect(addonStyles).toContain(
      "--console-resize-separator-active-grip-color",
    );
    expect(addonStyles).toContain("--console-resize-handle-size");
    expect(addonStyles).toContain("--console-resize-corner-size");
  });
});
