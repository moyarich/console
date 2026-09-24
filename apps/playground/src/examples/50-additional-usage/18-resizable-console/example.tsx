import { useMemo, useState, type CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  createResizableConsoleAddon,
  type ConsoleResizeDirection,
} from "@moyarich/console-addon-resizable";
import "@moyarich/console/styles.css";
import "@moyarich/console-addon-resizable/styles.css";

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
  "--console-resize-separator-line-background-color": "#d0d5dd",
  "--console-resize-separator-hover-line-background-color": "#98a2b3",
  "--console-resize-separator-active-line-background-color": "#475467",
  "--console-resize-separator-grip-color": "#667085",
  "--console-resize-separator-active-grip-color": "#344054",
  "--console-resize-separator-grip-border": "1px solid #d0d5dd",
  "--console-resize-separator-grip-background-color": "#ffffff",
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
        subtitle="Resize behavior is provided by @moyarich/console-addon-resizable."
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
      />
    </div>
  );
}
