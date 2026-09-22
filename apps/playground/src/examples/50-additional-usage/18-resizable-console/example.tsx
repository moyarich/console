import { useState } from "react";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleMessageModeProps,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

type ResizeDirection = NonNullable<ConsoleMessageModeProps["resizable"]>;

const directions: ResizeDirection[] = [
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

export default function ResizableConsoleExample() {
  const [resizable, setResizable] = useState<ResizeDirection>("both");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          width: "fit-content",
        }}
      >
        Resize direction
        <select
          value={resizable}
          onChange={(event) =>
            setResizable(event.target.value as ResizeDirection)
          }
        >
          {directions.map((direction) => (
            <option key={direction} value={direction}>
              {direction}
            </option>
          ))}
        </select>
      </label>

      <Console
        messages={messages}
        resizable={resizable}
        autoScroll={false}
        title="Resizable console"
        subtitle="Drag the native resize handle; the output viewport stays scrollable."
        style={{
          width: 720,
          height: 300,
          minWidth: 320,
          minHeight: 180,
          maxWidth: "100%",
          maxHeight: 600,
        }}
      />
    </div>
  );
}
