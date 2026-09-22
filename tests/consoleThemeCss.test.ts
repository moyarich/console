import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = fileURLToPath(
  new URL("../packages/console/src/styles.css", import.meta.url),
);
const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));

const styles = readFileSync(stylesPath, "utf8");
const readme = readFileSync(readmePath, "utf8");

function collectPublicThemeTokens(source: string) {
  return Array.from(
    new Set(source.match(/--console-[\w-]+/g) ?? []),
  ).sort();
}

describe("console theme CSS", () => {
  it("keeps public console custom properties as inputs only", () => {
    const publicAssignments = styles.match(/^\s*--console-[\w-]+\s*:/gm);

    expect(publicAssignments).toBeNull();
  });

  it("resolves property-specific public theme inputs through private tokens", () => {
    expect(styles).toContain(
      "--_console-background-color: var(--console-background-color, #1e1e1e);",
    );
    expect(styles).toContain(
      "--_console-panel-border: var(\n" +
        "    --console-panel-border,\n" +
        "    1px solid #dde4ef\n" +
        "  );",
    );
    expect(styles).toContain(
      "--_console-panel-header-border-bottom: var(\n" +
        "    --console-panel-header-border-bottom,\n" +
        "    1px solid #e5eaf2\n" +
        "  );",
    );
    expect(styles).toContain(
      "--_console-context-menu-border: var(\n" +
        "    --console-context-menu-border,\n" +
        "    1px solid #454545\n" +
        "  );",
    );
  });

  it("uses shorthand tokens only with their matching shorthand properties", () => {
    expect(styles).toContain("border: var(--_console-panel-border);");
    expect(styles).toContain(
      "border-bottom: var(--_console-panel-header-border-bottom);",
    );
    expect(styles).toContain(
      "border: var(--_console-panel-control-border);",
    );
    expect(styles).toContain(
      "border-bottom: var(--_console-entry-border-bottom);",
    );
    expect(styles).toContain(
      "border-left: var(--_console-stderr-border-left);",
    );
    expect(styles).toContain(
      "border-left: var(--_console-clear-line-border-left);",
    );
    expect(styles).toContain(
      "border-left: var(--_console-object-border-left);",
    );
    expect(styles).toContain("border: var(--_console-table-border);");
    expect(styles).toContain("outline: var(--_console-message-action-focus-outline);");
    expect(styles).toContain("border: var(--_console-context-menu-border);");
  });

  it("uses explicit color-property tokens for color-only theming", () => {
    expect(styles).toContain(
      "background-color: var(--_console-panel-background-color);",
    );
    expect(styles).toContain("color: var(--_console-panel-color);");
    expect(styles).toContain(
      "border-color: var(--_console-warning-border-color);",
    );
    expect(styles).toContain(
      "background-color: var(--_console-warning-background-color);",
    );
    expect(styles).toContain(
      "background-color: var(--_console-context-menu-hover-background-color);",
    );
    expect(styles).toContain(
      "background-color: var(--_console-context-menu-separator-background-color);",
    );
  });

  it("does not expose the previous ambiguous public theme token names", () => {
    const legacyTokens = [
      "--console-panel-background",
      "--console-panel-foreground",
      "--console-panel-muted",
      "--console-panel-border-color",
      "--console-panel-header-background",
      "--console-panel-header-border",
      "--console-panel-header-border-color",
      "--console-panel-radius",
      "--console-panel-shadow",
      "--console-panel-popover-shadow",
      "--console-panel-control-background",
      "--console-panel-control-border-color",
      "--console-panel-control-foreground",
      "--console-panel-control-hover-background",
      "--console-panel-control-hover-foreground",
      "--console-background",
      "--console-foreground",
      "--console-border",
      "--console-border-color",
      "--console-warning-background",
      "--console-warning-foreground",
      "--console-error-background",
      "--console-error-foreground",
      "--console-info",
      "--console-debug",
      "--console-string",
      "--console-number",
      "--console-null",
      "--console-symbol",
      "--console-circular",
      "--console-muted",
      "--console-subtle",
      "--console-group-marker",
      "--console-object-border",
      "--console-table-border-color",
      "--console-table-header-background",
      "--console-table-even-background",
      "--console-empty-foreground",
      "--console-header-icon",
      "--console-icon-hover-background",
      "--console-property-key",
      "--console-object-property-key",
      "--console-message-icon-hover-background",
      "--console-context-menu-background",
      "--console-context-menu-border-color",
      "--console-context-menu-foreground",
      "--console-context-menu-muted",
      "--console-context-menu-hover",
      "--console-context-menu-hover-background",
      "--console-context-menu-hover-foreground",
      "--console-context-menu-icon",
      "--console-context-menu-danger",
      "--console-context-menu-radius",
      "--console-context-menu-shadow",
    ];

    const publicTokens = collectPublicThemeTokens(styles);

    for (const token of legacyTokens) {
      expect(publicTokens).not.toContain(token);
    }
  });

  it("documents every public theme token in the README theming section", () => {
    const themingStart = readme.indexOf("## Theming with CSS custom properties");
    const themingEnd = readme.indexOf(
      "\n## Extensible panel, context, and message actions",
      themingStart,
    );

    expect(themingStart).toBeGreaterThanOrEqual(0);
    expect(themingEnd).toBeGreaterThan(themingStart);

    const documentedTokens = collectPublicThemeTokens(
      readme.slice(themingStart, themingEnd),
    );

    expect(documentedTokens).toEqual(collectPublicThemeTokens(styles));
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
