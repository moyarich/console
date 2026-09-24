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
  it("owns System, Light, and Dark theme selection at the app shell", () => {
    expect(app).toContain('{ value: "system", label: "System" }');
    expect(app).toContain('{ value: "light", label: "Light" }');
    expect(app).toContain('{ value: "dark", label: "Dark" }');
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
