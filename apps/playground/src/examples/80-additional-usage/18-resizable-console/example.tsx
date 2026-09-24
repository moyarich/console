import { useMemo, useState, type CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  createResizableConsoleAddon,
  type ConsoleResizeDirection,
} from "@moyarich/console-addon-resizable";

type ConsoleThemeStyle = CSSProperties &
  Partial<Record<`--console-${string}`, string>>;

type ThemePreference = "system" | "light" | "dark";

const directions: ConsoleResizeDirection[] = [
  "vertical",
  "horizontal",
  "both",
  "block",
  "inline",
];

const themePreferences: ThemePreference[] = ["system", "light", "dark"];

const messages: ConsoleMessageData[] = Array.from(
  { length: 24 },
  (_, index) => ({
    id: `resize-${index}`,
    method: index % 8 === 0 ? "warn" : "log",
    depth: 0,
    data: [
      `Message ${index + 1}`,
      {
        status: index % 8 === 0 ? "warning" : "ready",
        resizeSafe: true,
      },
    ],
  }),
);

const themeTokens = {
  "--console-panel-width": "100%",
  "--console-panel-height": "100%",
  "--console-panel-min-width": "0",
  "--console-panel-min-height": "0",
  "--console-panel-background-color": "light-dark(#ffffff, #161b22)",
  "--console-panel-color": "light-dark(#202c40, #e6edf3)",
  "--console-panel-border":
    "1px solid light-dark(#dde4ef, #30363d)",
  "--console-background-color": "light-dark(#f8fafc, #1e1e1e)",
  "--console-color": "light-dark(#172033, #d8dee9)",
  "--console-entry-border-bottom":
    "1px solid light-dark(#e5e7eb, #303030)",
  "--console-warning-border-color": "light-dark(#f4c542, #5e4d00)",
  "--console-warning-background-color": "light-dark(#fff8db, #332b00)",
  "--console-warning-color": "light-dark(#7a5d00, #ffd99a)",
  "--console-info-color": "light-dark(#175cd3, #a8c7fa)",
  "--console-debug-color": "light-dark(#475467, #8ab4f8)",
  "--console-string-color": "light-dark(#b42318, #f28b82)",
  "--console-number-color": "light-dark(#175cd3, #8ab4f8)",
  "--console-null-color": "light-dark(#7f56d9, #c58af9)",
  "--console-symbol-color": "light-dark(#027a48, #81c995)",
  "--console-muted-color": "light-dark(#667085, #a8aeb8)",
  "--console-subtle-color": "light-dark(#98a2b3, #80868b)",
  "--console-object-border-left":
    "1px solid light-dark(#d0d5dd, #3a3a3a)",
  "--console-resize-separator-line-background-color":
    "light-dark(#d0d5dd, #475467)",
  "--console-resize-separator-hover-line-background-color":
    "light-dark(#98a2b3, #667085)",
  "--console-resize-separator-active-line-background-color":
    "light-dark(#475467, #d0d5dd)",
  "--console-resize-separator-grip-color":
    "light-dark(#667085, #98a2b3)",
  "--console-resize-separator-active-grip-color":
    "light-dark(#344054, #eaecf0)",
  "--console-resize-separator-grip-border":
    "1px solid light-dark(#d0d5dd, #475467)",
  "--console-resize-separator-grip-background-color":
    "light-dark(#ffffff, #1d2939)",
  "--console-resize-separator-grip-border-radius": "999px",
  "--console-resize-separator-grip-box-shadow":
    "0 2px 8px rgb(16 24 40 / 0.14)",
} as ConsoleThemeStyle;

export default function ResizableConsoleExample() {
  const [direction, setDirection] = useState<ConsoleResizeDirection>("both");
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");

  const colorScheme =
    themePreference === "system" ? "light dark" : themePreference;

  const resizableAddon = useMemo(
    () =>
      createResizableConsoleAddon({
        direction,
        defaultWidth: 720,
        defaultHeight: 300,
        minWidth: 320,
        minHeight: 180,
        maxHeight: 600,
      }),
    [direction],
  );

  const theme = {
    ...themeTokens,
    "--console-color-scheme": colorScheme,
  } as ConsoleThemeStyle;

  return (
    <div style={{ width: "100%", minWidth: 0, ...theme }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Theme
          <select
            value={themePreference}
            onChange={(event) =>
              setThemePreference(event.target.value as ThemePreference)
            }
          >
            {themePreferences.map((value) => (
              <option key={value} value={value}>
                {value === "system"
                  ? "System"
                  : value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Resize direction
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as ConsoleResizeDirection)
            }
          >
            {directions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Console
        messages={messages}
        addons={[resizableAddon]}
        autoScroll={false}
        title="Resizable console"
        subtitle="Resize handles inherit the console color scheme and theme tokens."
      />
    </div>
  );
}
