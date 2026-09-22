import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = fileURLToPath(
  new URL("../packages/console/src/styles.css", import.meta.url),
);
const styles = readFileSync(stylesPath, "utf8");

describe("console theme CSS", () => {
  it("keeps public console custom properties as inputs only", () => {
    const publicAssignments = styles.match(/^\s*--console-[\w-]+\s*:/gm);

    expect(publicAssignments).toBeNull();
  });

  it("resolves public theme inputs through private internal tokens", () => {
    expect(styles).toContain(
      "--_console-background: var(--console-background, #1e1e1e);",
    );
    expect(styles).toContain(
      "--_console-panel-background: var(--console-panel-background, #fff);",
    );
    expect(styles).toContain("--_console-context-menu-background: var(");
  });

  it("keeps console content shrinkable inside narrow containers", () => {
    expect(styles).toContain(
      ".console-panel {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;",
    );
    expect(styles).toContain(
      ".console-panel .console-surface {\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;",
    );
    expect(styles).toContain(
      ".console-panel .console-values > * {\n  min-width: 0;\n  max-width: 100%;",
    );
    expect(styles).toContain(
      ".console-panel .console-property-value {\n  min-width: 0;\n  max-width: 100%;",
    );
    expect(styles).not.toContain(
      ".console-property-value {\n  min-width: 12ch;",
    );
  });

  it("keeps every public resize direction wired to native CSS resize", () => {
    for (const direction of [
      "vertical",
      "horizontal",
      "both",
      "block",
      "inline",
    ]) {
      expect(styles).toContain(
        `.console-panel[data-resizable="${direction}"] {\n  resize: ${direction};\n}`,
      );
    }

    expect(styles).toContain(
      ".console-panel[data-resizable] .console-surface,\n" +
        ".console-panel[data-resizable] .console-empty,\n" +
        ".console-panel[data-resizable] .console-stdout-empty {\n" +
        "  min-height: 0;\n" +
        "}",
    );
  });

  it("supports separate native color schemes for console surfaces", () => {
    expect(styles).toContain(
      "color-scheme: var(--_console-panel-color-scheme);",
    );
    expect(styles).toContain("color-scheme: var(--_console-color-scheme);");
    expect(styles).toContain(
      "color-scheme: var(--_console-context-menu-color-scheme);",
    );
  });
});
