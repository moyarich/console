import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const app = readFileSync(
  fileURLToPath(new URL("../apps/playground/src/App.tsx", import.meta.url)),
  "utf8",
);
const playgroundStyles = readFileSync(
  fileURLToPath(new URL("../apps/playground/src/styles.css", import.meta.url)),
  "utf8",
);
const playgroundMain = readFileSync(
  fileURLToPath(new URL("../apps/playground/src/main.tsx", import.meta.url)),
  "utf8",
);
const resizableExample = readFileSync(
  fileURLToPath(
    new URL(
      "../apps/playground/src/examples/80-additional-usage/18-resizable-console/example.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);
const resizableStyles = readFileSync(
  fileURLToPath(
    new URL("../packages/addons/resizable/src/styles.css", import.meta.url),
  ),
  "utf8",
);

describe("playground color scheme", () => {
  it("owns an icon-based System, Light, and Dark appearance switcher", () => {
    expect(app).toContain('import { Monitor, Moon, Sun } from "lucide-react";');
    expect(app).toContain(
      '{ value: "system", label: "System", Icon: Monitor }',
    );
    expect(app).toContain('{ value: "light", label: "Light", Icon: Sun }');
    expect(app).toContain('{ value: "dark", label: "Dark", Icon: Moon }');
    expect(app).toContain('aria-label="Appearance"');
    expect(app).toContain("aria-pressed={isActive}");
    expect(app).toContain('themePreference === "system" ? "light dark"');
    expect(app).toContain("root.style.colorScheme = colorScheme");
    expect(app).not.toContain(
      'root.style.setProperty("--console-color-scheme", colorScheme)',
    );
  });

  it("themes the playground with a neutral accent color system", () => {
    expect(playgroundStyles).toContain("color-scheme: light dark;");
    expect(playgroundStyles).not.toContain(
      "--console-color-scheme: light dark;",
    );
    expect(playgroundStyles).toContain(
      "--playground-background: light-dark(#f7f7f8, #09090b);",
    );
    expect(playgroundStyles).toContain(
      "--playground-surface: light-dark(#ffffff, #111113);",
    );
    expect(playgroundStyles).toContain(
      "--playground-text: light-dark(#111113, #f4f4f5);",
    );
    expect(playgroundStyles).toContain(
      "--playground-accent: light-dark(#635bff, #8b83ff);",
    );
    expect(playgroundStyles.match(/color-mix\(/g)?.length ?? 0).toBeGreaterThan(
      12,
    );
  });

  it("uses bundled Inter with a deterministic system fallback stack", () => {
    expect(playgroundMain).toContain('import "@fontsource-variable/inter";');
    expect(playgroundStyles).toContain("--font-sans:");
    expect(playgroundStyles).toContain('"Inter Variable"');
    expect(playgroundStyles).toContain('"-apple-system-body"');
    expect(playgroundStyles).toContain("font-family: var(--font-sans);");
    expect(playgroundStyles).toContain("-webkit-font-smoothing: antialiased;");
    expect(playgroundStyles).toContain("-moz-osx-font-smoothing: grayscale;");
  });

  it("uses lighter typography weights for general playground UI", () => {
    expect(playgroundStyles).toContain("font-weight: 400;");
    expect(playgroundStyles).toContain("strong,\nb {\n  font-weight: 500;\n}");
    expect(playgroundStyles).not.toContain("font-weight: 750;");
    expect(playgroundStyles).not.toContain("font-weight: 800;");
    expect(playgroundStyles).toContain(
      '.theme-switcher-button[aria-pressed="true"]',
    );
  });

  it("renders a GitHub repository icon link", () => {
    expect(app).toContain("function GitHubIcon()");
    expect(app).toContain('aria-label="Open @moyarich/console on GitHub"');
    expect(app).toContain("<GitHubIcon />");
  });

  it("keeps resize examples theme-headless and inherits the global scheme", () => {
    expect(resizableExample).not.toContain("ThemePreference");
    expect(resizableExample).not.toContain("Playground theme");
    expect(resizableStyles).toContain("var(--console-color-scheme, inherit)");
    expect(resizableStyles).toContain(
      "color-scheme: var(--_console-resize-color-scheme);",
    );
  });
});
