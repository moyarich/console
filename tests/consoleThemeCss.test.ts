import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = fileURLToPath(
  new URL("../packages/console/src/styles.css", import.meta.url),
);
const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));
const resizableAddonStylesPath = fileURLToPath(
  new URL("../packages/addons/resizable/src/styles.css", import.meta.url),
);
const consoleIndexPath = fileURLToPath(
  new URL("../packages/console/src/index.ts", import.meta.url),
);
const contextMenuThemeStylePath = fileURLToPath(
  new URL(
    "../packages/console/src/utils/console/style/getContextMenuThemeStyle.ts",
    import.meta.url,
  ),
);
const resizableAddonIndexPath = fileURLToPath(
  new URL("../packages/addons/resizable/src/index.tsx", import.meta.url),
);
const consolePackagePath = fileURLToPath(
  new URL("../packages/console/package.json", import.meta.url),
);
const resizableAddonPackagePath = fileURLToPath(
  new URL("../packages/addons/resizable/package.json", import.meta.url),
);

const styles = readFileSync(stylesPath, "utf8");
const readme = readFileSync(readmePath, "utf8");
const resizableAddonStyles = readFileSync(resizableAddonStylesPath, "utf8");
const consoleIndex = readFileSync(consoleIndexPath, "utf8");
const contextMenuThemeStyle = readFileSync(contextMenuThemeStylePath, "utf8");
const resizableAddonIndex = readFileSync(resizableAddonIndexPath, "utf8");
const consolePackage = JSON.parse(readFileSync(consolePackagePath, "utf8")) as {
  scripts: { build: string };
};
const resizableAddonPackage = JSON.parse(
  readFileSync(resizableAddonPackagePath, "utf8"),
) as {
  scripts: { build: string };
};

function collectPublicThemeTokens(source: string) {
  return Array.from(new Set(source.match(/--console-[\w-]+/g) ?? [])).sort();
}

describe("console theme CSS", () => {
  it("loads each package's stylesheet from its own entrypoint", () => {
    expect(consoleIndex).toContain('import "./styles.css";');
    expect(resizableAddonIndex).toContain('import "./styles.css";');
    expect(consolePackage.scripts.build).toContain("--inject-style");
    expect(resizableAddonPackage.scripts.build).toContain("--inject-style");
    expect(readme).not.toContain('import "@moyarich/console/styles.css";');
    expect(readme).not.toContain(
      'import "@moyarich/console-addon-resizable/styles.css";',
    );
  });

  it("keeps resize CSS owned by the resizable addon", () => {
    expect(styles).not.toContain("console-resizable");
    expect(styles).not.toContain("console-resize-");
    expect(styles).not.toContain("--console-resize-");

    expect(resizableAddonStyles).toContain(
      '[data-console-resize-direction="horizontal"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-direction="vertical"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-direction="both"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-direction="inline"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-direction="block"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-horizontal-edge="start"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-horizontal-edge="end"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-vertical-edge="start"]',
    );
    expect(resizableAddonStyles).toContain(
      '[data-console-resize-vertical-edge="end"]',
    );
    expect(resizableAddonStyles).toContain(
      "var(--_console-resizable-min-width)",
    );
    expect(resizableAddonStyles).toContain(
      "var(--_console-resizable-max-height)",
    );
    expect(resizableAddonStyles).toContain(
      "--console-resize-separator-grip-background-color",
    );
    expect(resizableAddonStyles).toContain("--console-resize-handle-size");
  });

  it("keeps public console custom properties as inputs only", () => {
    const publicAssignments = styles.match(/^\s*--console-[\w-]+\s*:/gm);

    expect(publicAssignments).toBeNull();
  });

  it("resolves public theme inputs through neutral private defaults", () => {
    expect(styles).toContain(
      "--_console-base-background: light-dark(#f7f7f8, #09090b);",
    );
    expect(styles).toContain(
      "--_console-base-surface: light-dark(#ffffff, #111113);",
    );
    expect(styles).toContain(
      "--_console-base-text: light-dark(#18181b, #f4f4f5);",
    );
    expect(styles).toContain(
      "--_console-accent-color: light-dark(#635bff, #8b83ff);",
    );
    expect(styles).toContain(
      "var(--console-background-color,\n    var(--_console-base-background)",
    );
    expect(styles).toContain(
      "--_console-panel-width: var(--console-panel-width, 100%);",
    );
    expect(styles).toContain(
      "--_console-panel-height: var(--console-panel-height, auto);",
    );
    expect(styles).toContain(
      "--_console-panel-min-width: var(--console-panel-min-width, 0);",
    );
    expect(styles).toContain(
      "--_console-panel-min-height: var(--console-panel-min-height, 0);",
    );
    expect(styles).toContain("color-mix(");
  });

  it("keeps header chrome aligned with the neutral and accent palette", () => {
    expect(styles).toMatch(
      /--_console-panel-color-scheme:\s*var\(\s*--console-panel-color-scheme,\s*var\(--console-color-scheme, inherit\)\s*\);/,
    );
    expect(styles).toContain("--_console-panel-background-color: var(");
    expect(styles).toContain("--_console-header-icon-color: var(");
    expect(styles).toContain("var(--_console-accent-color)");
    expect(styles).toContain(
      "--_console-panel-control-hover-border-color: var(",
    );
  });

  it("uses color-scheme-driven light-dark and color-mix fallbacks", () => {
    expect(styles).toContain(
      "--_console-color-scheme: var(--console-color-scheme, inherit);",
    );
    expect(styles).not.toContain("@media (prefers-color-scheme");

    for (const value of [
      "light-dark(#f7f7f8, #09090b)",
      "light-dark(#ffffff, #111113)",
      "light-dark(#18181b, #f4f4f5)",
      "light-dark(#635bff, #8b83ff)",
      "light-dark(#b42318, #fb7185)",
      "light-dark(#b54708, #fbbf24)",
      "light-dark(#067647, #4ade80)",
      "light-dark(#9f1239, #fb7185)",
      "light-dark(#1d4ed8, #60a5fa)",
    ]) {
      expect(styles).toContain(value);
    }

    expect(styles.match(/color-mix\(/g)?.length ?? 0).toBeGreaterThan(12);
  });

  it("keeps console typography restrained", () => {
    expect(styles).not.toContain("font-weight: 820;");
    expect(styles).not.toContain("font-weight: 700;");
    expect(styles).toContain("font-weight: 600;");
    expect(styles).toContain("font-weight: 500;");
  });

  it("keeps the resizable addon on the same neutral accent system", () => {
    expect(resizableAddonStyles).toContain("light-dark(#635bff, #8b83ff)");
    expect(resizableAddonStyles).toContain(
      "color-mix(in oklab, currentColor 18%, transparent)",
    );
    expect(resizableAddonStyles).toContain(
      "color-mix(in oklab, currentColor 38%, transparent)",
    );
  });

  it("preserves inherited color-scheme when the context menu is portaled", () => {
    expect(contextMenuThemeStyle).toContain(
      'themeStyle["--console-context-menu-color-scheme"]',
    );
    expect(contextMenuThemeStyle).toContain(
      'themeStyle["--console-color-scheme"]',
    );
    expect(contextMenuThemeStyle).toContain(
      "themeStyle.colorScheme = computedStyle.colorScheme",
    );
  });

  it("uses shorthand tokens only with their matching shorthand properties", () => {
    expect(styles).toContain("border: var(--_console-panel-border);");
    expect(styles).toContain(
      "border-bottom: var(--_console-panel-header-border-bottom);",
    );
    expect(styles).toContain("border: var(--_console-panel-control-border);");
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
    expect(styles).toContain(
      "outline: var(--_console-message-action-focus-outline);",
    );
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
    const themingStart = readme.indexOf(
      "## Theming with CSS custom properties",
    );
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
      ".console-panel {\n  display: flex;\n  width: var(--_console-panel-width);\n  height: var(--_console-panel-height);\n  min-width: var(--_console-panel-min-width);\n  min-height: var(--_console-panel-min-height);\n  max-width: 100%;",
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
