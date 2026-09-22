import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleMessageModeProps,
} from "@moyarich/console";

type DockPosition = "bottom" | "right";

const initialMessages: ConsoleMessageData[] = [
  {
    id: "run",
    method: "info",
    depth: 0,
    data: ["Running src/App.tsx"],
  },
  {
    id: "log",
    method: "log",
    depth: 0,
    data: ["Counter initialized", { count: 0, ready: true }],
  },
  {
    id: "warn",
    method: "warn",
    depth: 0,
    data: ["Development mode is enabled"],
  },
  {
    id: "done",
    method: "log",
    depth: 0,
    data: ["Build completed in 184 ms"],
  },
];

const initialSource = `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  console.log("Counter initialized", {
    count,
    ready: true,
  });

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}
`;

function EditorShell() {
  const [dock, setDock] = useState<DockPosition>("bottom");
  const [minimized, setMinimized] = useState(false);
  const [source, setSource] = useState(initialSource);
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const consolePane = minimized ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minWidth: 0,
        borderTop: dock === "bottom" ? "1px solid #30363d" : undefined,
        borderLeft: dock === "right" ? "1px solid #30363d" : undefined,
        padding: "8px 10px",
        background: "#161b22",
        color: "#c9d1d9",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
      }}
    >
      <strong>Console</strong>
      <button type="button" onClick={() => setMinimized(false)}>
        Restore
      </button>
    </div>
  ) : (
    <Console
      messages={messages}
      onClear={() => setMessages([])}
      autoScroll={false}
      resizable={dock === "bottom" ? "vertical" : "horizontal"}
      title="Console"
      subtitle={
        dock === "bottom"
          ? "Docked to bottom · drag the resize handle vertically"
          : "Docked to right · drag the resize handle horizontally"
      }
      style={
        dock === "bottom"
          ? {
              width: "100%",
              height: 250,
              minHeight: 150,
              maxHeight: 480,
              borderRadius: 0,
            }
          : {
              width: 390,
              minWidth: 280,
              maxWidth: 620,
              height: "100%",
              minHeight: 0,
              borderRadius: 0,
            }
      }
      panelActions={[
        {
          id: "minimize",
          label: "Minimize console",
          onSelect: () => setMinimized(true),
        },
      ]}
    />
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "42px minmax(0, 1fr)",
        height: 720,
        overflow: "hidden",
        border: "1px solid #30363d",
        borderRadius: 10,
        background: "#0d1117",
        boxShadow: "0 16px 40px rgb(0 0 0 / 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #30363d",
          padding: "0 10px",
          background: "#161b22",
          color: "#c9d1d9",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
        }}
      >
        <strong style={{ marginRight: "auto" }}>src/App.tsx</strong>

        <button
          type="button"
          onClick={() => {
            setMessages(initialMessages);
            setMinimized(false);
          }}
        >
          Run
        </button>

        <span aria-hidden="true">Dock:</span>

        <button
          type="button"
          aria-pressed={dock === "bottom"}
          onClick={() => {
            setDock("bottom");
            setMinimized(false);
          }}
        >
          Bottom
        </button>

        <button
          type="button"
          aria-pressed={dock === "right"}
          onClick={() => {
            setDock("right");
            setMinimized(false);
          }}
        >
          Right
        </button>

        <button type="button" onClick={() => setMinimized((value) => !value)}>
          {minimized ? "Restore console" : "Minimize console"}
        </button>
      </div>

      <div
        style={
          dock === "right"
            ? {
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                minHeight: 0,
                minWidth: 0,
              }
            : {
                display: "grid",
                gridTemplateRows: "minmax(0, 1fr) auto",
                minHeight: 0,
                minWidth: 0,
              }
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateRows: "34px minmax(0, 1fr)",
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
            background: "#0d1117",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #21262d",
              padding: "0 12px",
              color: "#8b949e",
              fontFamily: "system-ui, sans-serif",
              fontSize: 12,
            }}
          >
            TypeScript React
          </div>

          <textarea
            aria-label="Source code editor"
            value={source}
            spellCheck={false}
            onChange={(event) => setSource(event.target.value)}
            style={{
              width: "100%",
              height: "100%",
              minWidth: 0,
              minHeight: 0,
              resize: "none",
              border: 0,
              outline: 0,
              padding: 16,
              background: "#0d1117",
              color: "#e6edf3",
              fontFamily:
                '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: 13,
              lineHeight: 1.6,
              tabSize: 2,
            }}
          />
        </div>

        {consolePane}
      </div>
    </div>
  );
}

const meta = {
  title: "Console/Resizable Editor Shell",
  component: Console,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DockableConsole: Story = {
  render: () => (
    <div style={{ padding: 24 }}>
      <EditorShell />
    </div>
  ),
  args: {
    messages: [],
  },
};
