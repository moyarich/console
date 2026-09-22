import Editor from "@monaco-editor/react";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleMessageModeProps,
} from "@moyarich/console";

type DockPosition = "top" | "right" | "bottom" | "left";

const DOCK_POSITIONS: DockPosition[] = ["top", "right", "bottom", "left"];

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

function isHorizontalDock(dock: DockPosition) {
  return dock === "left" || dock === "right";
}

function EditorShell() {
  const [dock, setDock] = useState<DockPosition>("bottom");
  const [minimized, setMinimized] = useState(false);
  const [source, setSource] = useState(initialSource);
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const horizontalDock = isHorizontalDock(dock);

  const consolePane = minimized ? (
    <button
      type="button"
      onClick={() => setMinimized(false)}
      style={{
        display: "flex",
        width: horizontalDock ? 42 : "100%",
        height: horizontalDock ? "100%" : 42,
        minWidth: horizontalDock ? 42 : 0,
        minHeight: horizontalDock ? 0 : 42,
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        borderTop: dock === "bottom" ? "1px solid #30363d" : undefined,
        borderRight: dock === "left" ? "1px solid #30363d" : undefined,
        borderBottom: dock === "top" ? "1px solid #30363d" : undefined,
        borderLeft: dock === "right" ? "1px solid #30363d" : undefined,
        padding: 0,
        background: "#161b22",
        color: "#c9d1d9",
        cursor: "pointer",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 700,
        writingMode: horizontalDock ? "vertical-rl" : undefined,
      }}
    >
      Console
    </button>
  ) : (
    <Console
      messages={messages}
      onClear={() => setMessages([])}
      autoScroll={false}
      resizable={horizontalDock ? "horizontal" : "vertical"}
      title="Console"
      subtitle={`Docked to ${dock} · drag the native resize handle ${horizontalDock ? "horizontally" : "vertically"}`}
      style={
        horizontalDock
          ? {
              width: 390,
              minWidth: 280,
              maxWidth: 620,
              height: "100%",
              minHeight: 0,
              borderRadius: 0,
            }
          : {
              width: "100%",
              height: 250,
              minHeight: 150,
              maxHeight: 480,
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

  const editorPane = (
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

      <Editor
        path="file:///src/App.tsx"
        language="typescript"
        value={source}
        theme="vs-dark"
        onChange={(value) => setSource(value ?? "")}
        options={{
          automaticLayout: true,
          fontSize: 13,
          minimap: { enabled: false },
          padding: { top: 14 },
          scrollBeyondLastLine: false,
          tabSize: 2,
        }}
      />
    </div>
  );

  const panes =
    dock === "top" || dock === "left"
      ? [consolePane, editorPane]
      : [editorPane, consolePane];

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

        {DOCK_POSITIONS.map((position) => (
          <button
            key={position}
            type="button"
            aria-pressed={dock === position}
            onClick={() => {
              setDock(position);
              setMinimized(false);
            }}
          >
            {position[0]?.toUpperCase()}
            {position.slice(1)}
          </button>
        ))}

        <button type="button" onClick={() => setMinimized((value) => !value)}>
          {minimized ? "Restore console" : "Minimize console"}
        </button>
      </div>

      <div
        style={
          horizontalDock
            ? {
                display: "grid",
                gridTemplateColumns:
                  dock === "left"
                    ? "auto minmax(0, 1fr)"
                    : "minmax(0, 1fr) auto",
                minHeight: 0,
                minWidth: 0,
              }
            : {
                display: "grid",
                gridTemplateRows:
                  dock === "top"
                    ? "auto minmax(0, 1fr)"
                    : "minmax(0, 1fr) auto",
                minHeight: 0,
                minWidth: 0,
              }
        }
      >
        {panes}
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
