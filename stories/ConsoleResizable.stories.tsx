import {
  Minimize2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleMessageModeProps,
} from "@moyarich/console";
import {
  createResizableConsoleAddon,
  type ConsoleResizeDirection,
} from "@moyarich/console-addon-resizable";
import { MonacoEditor } from "../apps/playground/src/components/MonacoEditor";
import ResizableConsoleExample from "../apps/playground/src/examples/80-additional-usage/18-resizable-console/example";

type DockPosition = "top" | "right" | "bottom" | "left";

const DOCK_OPTIONS = [
  { position: "top", label: "Top", icon: PanelTop },
  { position: "right", label: "Right", icon: PanelRight },
  { position: "bottom", label: "Bottom", icon: PanelBottom },
  { position: "left", label: "Left", icon: PanelLeft },
] as const;

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

const darkResizeTheme = {
  "--console-resize-separator-line-background-color": "#30363d",
  "--console-resize-separator-hover-line-background-color": "#6e7681",
  "--console-resize-separator-active-line-background-color": "#58a6ff",
  "--console-resize-separator-grip-color": "#8b949e",
  "--console-resize-separator-active-grip-color": "#58a6ff",
  "--console-resize-separator-grip-border": "1px solid #3d444d",
  "--console-resize-separator-grip-background-color": "#21262d",
  "--console-resize-separator-grip-border-radius": "999px",
  "--console-resize-separator-grip-box-shadow": "0 2px 8px rgb(0 0 0 / 0.28)",
} as CSSProperties;

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
  const resizeDirection: ConsoleResizeDirection = horizontalDock
    ? "horizontal"
    : "vertical";

  const resizableAddon = useMemo(
    () =>
      createResizableConsoleAddon({
        direction: resizeDirection,
        defaultWidth: 390,
        defaultHeight: 250,
        minWidth: 220,
        minHeight: 150,
        maxWidth: 620,
        maxHeight: 520,
        horizontalEdge: dock === "right" ? "start" : "end",
        verticalEdge: dock === "bottom" ? "start" : "end",
        style: darkResizeTheme,
      }),
    [dock, resizeDirection],
  );

  const consolePane = minimized ? (
    <button
      key="console"
      type="button"
      onClick={() => setMinimized(false)}
      style={{
        display: "flex",
        width: horizontalDock ? 38 : "100%",
        height: horizontalDock ? "100%" : 38,
        minWidth: horizontalDock ? 38 : 0,
        minHeight: horizontalDock ? 0 : 38,
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        padding: 0,
        background: "#161b22",
        color: "#c9d1d9",
        cursor: "pointer",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 700,
        writingMode: horizontalDock ? "vertical-rl" : undefined,
      }}
      aria-label="Restore console"
      title="Restore console"
    >
      Console
    </button>
  ) : (
    <Console
      key="console"
      messages={messages}
      addons={[resizableAddon]}
      onClear={() => setMessages([])}
      autoScroll={false}
      title="Console"
      subtitle={`Docked to ${dock}`}
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        borderRadius: 0,
      }}
      panelActions={[
        ...DOCK_OPTIONS.map(({ position, label, icon: Icon }) => ({
          id: `dock-${position}`,
          label: `Dock ${label.toLowerCase()}`,
          icon: <Icon size={14} aria-hidden="true" />,
          disabled: position === dock,
          onSelect: () => {
            setDock(position);
            setMinimized(false);
          },
        })),
        {
          id: "minimize",
          label: "Minimize console",
          icon: <Minimize2 size={14} aria-hidden="true" />,
          separatorBefore: true,
          onSelect: () => setMinimized(true),
        },
      ]}
    />
  );

  const editorPane = (
    <div
      key="editor"
      style={{
        display: "grid",
        gridTemplateRows: "34px minmax(0, 1fr)",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        background: "#0d1117",
      }}
    >
      <div
        style={{
          display: "flex",
          minWidth: 0,
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

      <div
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <MonacoEditor
          path="src/App.tsx"
          language="typescriptreact"
          value={source}
          width="100%"
          height="100%"
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
    </div>
  );

  const minimizedTrack = "38px";
  const workspaceStyle =
    dock === "left"
      ? {
          gridTemplateColumns: `${minimized ? minimizedTrack : "auto"} minmax(220px, 1fr)`,
          gridTemplateRows: "minmax(0, 1fr)",
        }
      : dock === "right"
        ? {
            gridTemplateColumns: `minmax(220px, 1fr) ${minimized ? minimizedTrack : "auto"}`,
            gridTemplateRows: "minmax(0, 1fr)",
          }
        : dock === "top"
          ? {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: `${minimized ? minimizedTrack : "auto"} minmax(220px, 1fr)`,
            }
          : {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: `minmax(220px, 1fr) ${minimized ? minimizedTrack : "auto"}`,
            };

  const panes =
    dock === "left" || dock === "top"
      ? [consolePane, editorPane]
      : [editorPane, consolePane];

  return (
    <div
      style={
        {
          display: "grid",
          gridTemplateRows: "44px minmax(0, 1fr)",
          width: "100%",
          height: "min(720px, calc(100vh - 48px))",
          minHeight: 460,
          overflow: "hidden",
          border: "1px solid #30363d",
          borderRadius: 10,
          background: "#0d1117",
          boxShadow: "0 16px 40px rgb(0 0 0 / 0.18)",
          "--console-color-scheme": "dark",
          "--console-context-menu-color-scheme": "dark",
        } as CSSProperties
      }
    >
      <div
        style={{
          display: "flex",
          minWidth: 0,
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          borderBottom: "1px solid #30363d",
          padding: "0 10px",
          background: "#161b22",
          color: "#c9d1d9",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
        }}
      >
        <strong style={{ marginRight: "auto", whiteSpace: "nowrap" }}>
          src/App.tsx
        </strong>

        <button
          type="button"
          onClick={() => {
            setMessages(initialMessages);
            setMinimized(false);
          }}
        >
          Run
        </button>
      </div>

      <div
        style={{
          display: "grid",
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          ...workspaceStyle,
        }}
      >
        {panes}
      </div>
    </div>
  );
}

const meta = {
  title: "Addons/Resizable Console",
  component: Console,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standalone: Story = {
  render: () => (
    <div style={{ padding: 24 }}>
      <ResizableConsoleExample />
    </div>
  ),
  args: {
    messages: [],
  },
};

export const DockableEditorShell: Story = {
  render: () => (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        padding: 24,
        overflow: "hidden",
      }}
    >
      <EditorShell />
    </div>
  ),
  args: {
    messages: [],
  },
};
