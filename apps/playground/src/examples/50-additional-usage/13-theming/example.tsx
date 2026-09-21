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
    "--console-panel-foreground": "#f8fafc",
    "--console-panel-muted": "#94a3b8",
    "--console-panel-border": "#334155",
    "--console-panel-header-border": "#334155",
    "--console-panel-control-background": "#1e293b",
    "--console-panel-control-border": "#475569",
    "--console-panel-control-foreground": "#e2e8f0",

    "--console-background": "#0f172a",
    "--console-foreground": "#e2e8f0",
    "--console-border": "#334155",
    "--console-muted": "#94a3b8",
    "--console-subtle": "#64748b",
    "--console-info": "#7dd3fc",
    "--console-debug": "#93c5fd",
    "--console-string": "#fda4af",
    "--console-number": "#93c5fd",
    "--console-null": "#d8b4fe",
    "--console-symbol": "#86efac",
    "--console-warning-border": "#854d0e",
    "--console-warning-background": "#422006",
    "--console-warning-foreground": "#fde68a",
    "--console-error-border": "#7f1d1d",
    "--console-error-background": "#450a0a",
    "--console-error-foreground": "#fecaca",

    "--console-context-menu-background": "#111827",
    "--console-context-menu-foreground": "#f8fafc",
    "--console-context-menu-border": "#475569",
  },
  light: {
    "--console-panel-color-scheme": "light",
    "--console-color-scheme": "light",
    "--console-context-menu-color-scheme": "light",

    "--console-panel-background": "#ffffff",
    "--console-panel-foreground": "#172033",
    "--console-panel-muted": "#667085",
    "--console-panel-border": "#d8dee8",
    "--console-panel-header-border": "#e2e8f0",
    "--console-panel-control-background": "#ffffff",
    "--console-panel-control-border": "#cbd5e1",
    "--console-panel-control-foreground": "#334155",

    "--console-background": "#f8fafc",
    "--console-foreground": "#172033",
    "--console-border": "#e2e8f0",
    "--console-muted": "#667085",
    "--console-subtle": "#98a2b3",
    "--console-info": "#175cd3",
    "--console-debug": "#3538cd",
    "--console-string": "#b42318",
    "--console-number": "#175cd3",
    "--console-null": "#7a5af8",
    "--console-symbol": "#027a48",
    "--console-warning-border": "#fdb022",
    "--console-warning-background": "#fffaeb",
    "--console-warning-foreground": "#7a2e0e",
    "--console-error-border": "#fda29b",
    "--console-error-background": "#fef3f2",
    "--console-error-foreground": "#912018",

    "--console-context-menu-background": "#ffffff",
    "--console-context-menu-foreground": "#172033",
    "--console-context-menu-border": "#d8dee8",
  },
};

export default function ThemingExample() {
  const [themeName, setThemeName] = useState<ThemeName>("dark");
  const theme = themes[themeName];

  return (
    <div style={{ display: "grid", gap: 12 }}>
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

      <div style={theme}>
        <Console
          messages={messages}
          title="Themeable console"
          subtitle="Public --console-* inputs + CSS color-scheme"
        />
      </div>

      <small>
        Hover icons and right-click the console after switching themes. Hover
        colors are derived with color-mix() unless you override the matching
        public hover variable.
      </small>
    </div>
  );
}
