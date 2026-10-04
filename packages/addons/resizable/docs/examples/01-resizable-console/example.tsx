import { useMemo, useState, type CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  createResizableConsoleAddon,
  type ConsoleResizeDirection,
} from "@moyarich/console-addon-resizable";

const directions: ConsoleResizeDirection[] = [
  "vertical",
  "horizontal",
  "both",
  "block",
  "inline",
];

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

const resizeTheme = {
  "--console-panel-width": "100%",
  "--console-panel-height": "100%",
  "--console-panel-min-width": "0",
  "--console-panel-min-height": "0",
  "--console-resize-separator-line-background-color":
    "light-dark(#d0d5dd, #475467)",
  "--console-resize-separator-hover-line-background-color":
    "light-dark(#98a2b3, #667085)",
  "--console-resize-separator-active-line-background-color":
    "light-dark(#475467, #d0d5dd)",
  "--console-resize-separator-grip-color": "light-dark(#667085, #98a2b3)",
  "--console-resize-separator-active-grip-color":
    "light-dark(#344054, #eaecf0)",
  "--console-resize-separator-grip-border":
    "1px solid light-dark(#d0d5dd, #475467)",
  "--console-resize-separator-grip-background-color":
    "light-dark(#ffffff, #1d2939)",
  "--console-resize-separator-grip-border-radius": "999px",
  "--console-resize-separator-grip-box-shadow":
    "0 2px 8px rgb(16 24 40 / 0.14)",
} as CSSProperties;

export default function ResizableConsoleExample() {
  const [direction, setDirection] = useState<ConsoleResizeDirection>("both");

  const resizableAddon = useMemo(
    () =>
      createResizableConsoleAddon({
        direction,
        defaultWidth: 720,
        defaultHeight: 300,
        minWidth: 320,
        minHeight: 180,
        maxHeight: 600,
        style: resizeTheme,
      }),
    [direction],
  );

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
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

      <Console
        messages={messages}
        addons={[resizableAddon]}
        autoScroll={false}
        title="Resizable console"
        subtitle="Resize handles inherit the playground color scheme."
      />
    </div>
  );
}
