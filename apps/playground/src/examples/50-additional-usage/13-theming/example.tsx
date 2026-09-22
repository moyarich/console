import { useState, type CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import "@moyarich/console/styles.css";

type ThemeName = "dark" | "light";

type ConsoleThemeStyle = CSSProperties &
  Partial<Record<`--console-${string}`, string>>;

const messages: ConsoleMessageData[] = [
  {
    id: "theme-info",
    method: "info",
    data: ["Theme inputs inherit through the console tree."],
    depth: 0,
  },
  {
    id: "theme-object",
    method: "log",
    data: [
      "Hover the object actions:",
      {
        themeable: true,
        derivedHoverColors: "color-mix()",
        contextMenu: "ported theme variables",
      },
    ],
    depth: 0,
  },
  {
    id: "theme-warning",
    method: "warn",
    data: ["Native scrollbars follow color-scheme."],
    depth: 0,
  },
  {
    id: "theme-error",
    method: "error",
    data: ["Right-click the console to inspect the themed context menu."],
    depth: 0,
  },
];

const themes: Record<ThemeName, ConsoleThemeStyle> = {
  dark: {
    "--console-panel-color-scheme": "dark",
    "--console-color-scheme": "dark",
    "--console-context-menu-color-scheme": "dark",

    "--console-panel-background": "#111827",
    "--console-panel-color": "#f8fafc",
    "--console-panel-muted-color": "#94a3b8",
    "--console-panel-border-color": "#334155",
    "--console-panel-header-border-color": "#334155",
    "--console-panel-control-background": "#1e293b",
    "--console-panel-control-border-color": "#475569",
    "--console-panel-control-color": "#e2e8f0",

    "--console-background": "#0f172a",
    "--console-color": "#e2e8f0",
    "--console-border-color": "#334155",
    "--console-muted-color": "#94a3b8",
    "--console-subtle-color": "#64748b",
    "--console-info-color": "#7dd3fc",
    "--console-debug-color": "#93c5fd",
    "--console-string-color": "#fda4af",
    "--console-number-color": "#93c5fd",
    "--console-null-color": "#d8b4fe",
    "--console-symbol-color": "#86efac",
    "--console-warning-border-color": "#854d0e",
    "--console-warning-background": "#422006",
    "--console-warning-color": "#fde68a",
    "--console-error-border-color": "#7f1d1d",
    "--console-error-background": "#450a0a",
    "--console-error-color": "#fecaca",

    "--console-context-menu-background": "#111827",
    "--console-context-menu-color": "#f8fafc",
    "--console-context-menu-border-color": "#475569",
  },
  light: {
    "--console-panel-color-scheme": "light",
    "--console-color-scheme": "light",
    "--console-context-menu-color-scheme": "light",

    "--console-panel-background": "#ffffff",
    "--console-panel-color": "#172033",
    "--console-panel-muted-color": "#667085",
    "--console-panel-border-color": "#d8dee8",
    "--console-panel-header-border-color": "#e2e8f0",
    "--console-panel-control-background": "#ffffff",
    "--console-panel-control-border-color": "#cbd5e1",
    "--console-panel-control-color": "#334155",

    "--console-background": "#f8fafc",
    "--console-color": "#172033",
    "--console-border-color": "#e2e8f0",
    "--console-muted-color": "#667085",
    "--console-subtle-color": "#98a2b3",
    "--console-info-color": "#175cd3",
    "--console-debug-color": "#3538cd",
    "--console-string-color": "#b42318",
    "--console-number-color": "#175cd3",
    "--console-null-color": "#7a5af8",
    "--console-symbol-color": "#027a48",
    "--console-warning-border-color": "#fdb022",
    "--console-warning-background": "#fffaeb",
    "--console-warning-color": "#7a2e0e",
    "--console-error-border-color": "#fda29b",
    "--console-error-background": "#fef3f2",
    "--console-error-color": "#912018",

    "--console-context-menu-background": "#ffffff",
    "--console-context-menu-color": "#172033",
    "--console-context-menu-border-color": "#d8dee8",
  },
};

export default function ThemingExample() {
  const [themeName, setThemeName] = useState<ThemeName>("dark");
  const theme = themes[themeName];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        minWidth: 0,
        maxWidth: "100%",
        gap: 12,
      }}
    >
      <div className="button-row">
        <button
          type="button"
          aria-pressed={themeName === "dark"}
          onClick={() => setThemeName("dark")}
        >
          Dark theme
        </button>

        <button
          type="button"
          aria-pressed={themeName === "light"}
          onClick={() => setThemeName("light")}
        >
          Light theme
        </button>
      </div>

      <div style={{ ...theme, minWidth: 0, maxWidth: "100%" }}>
        <Console
          messages={messages}
          title="Themeable console"
          subtitle="Public --console-* inputs + CSS color-scheme"
        />
      </div>

      <small style={{ minWidth: 0, overflowWrap: "anywhere" }}>
        Hover icons and right-click the console after switching themes. Hover
        colors are derived with color-mix() unless you override the matching
        public hover variable.
      </small>
    </div>
  );
}
