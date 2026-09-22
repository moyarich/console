import {
  GripHorizontal,
  GripVertical,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleMessageModeProps,
} from "@moyarich/console";

type DockPosition = "top" | "right" | "bottom" | "left";

const DOCK_OPTIONS = [
  { position: "top", label: "Top", icon: PanelTop },
  { position: "right", label: "Right", icon: PanelRight },
  { position: "bottom", label: "Bottom", icon: PanelBottom },
  { position: "left", label: "Left", icon: PanelLeft },
] as const satisfies readonly {
  position: DockPosition;
  label: string;
  icon: typeof PanelTop;
}[];

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

const MIN_CONSOLE_SIZE = 150;
const MIN_EDITOR_SIZE = 220;
const SPLITTER_SIZE = 10;

function isHorizontalDock(dock: DockPosition) {
  return dock === "left" || dock === "right";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function EditorShell() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState<DockPosition>("bottom");
  const [minimized, setMinimized] = useState(false);
  const [verticalSize, setVerticalSize] = useState(250);
  const [horizontalSize, setHorizontalSize] = useState(390);
  const [source, setSource] = useState(initialSource);
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const horizontalDock = isHorizontalDock(dock);
  const consoleSize = horizontalDock ? horizontalSize : verticalSize;

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    if (minimized) return;

    event.preventDefault();
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startSize = consoleSize;
    const bounds = workspace.getBoundingClientRect();
    const maxSize =
      (horizontalDock ? bounds.width : bounds.height) -
      MIN_EDITOR_SIZE -
      SPLITTER_SIZE;

    const handlePointerMove = (pointerEvent: globalThis.PointerEvent) => {
      const delta = horizontalDock
        ? pointerEvent.clientX - startX
        : pointerEvent.clientY - startY;
      const direction = dock === "left" || dock === "top" ? 1 : -1;
      const nextSize = clamp(
        startSize + delta * direction,
        MIN_CONSOLE_SIZE,
        maxSize,
      );

      if (horizontalDock) {
        setHorizontalSize(nextSize);
      } else {
        setVerticalSize(nextSize);
      }
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = horizontalDock ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
  };

  const consolePane = minimized ? (
    <button
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
    <div
      style={{
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Console
        messages={messages}
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
          {
            id: "minimize",
            label: "Minimize console",
            onSelect: () => setMinimized(true),
          },
        ]}
      />
    </div>
  );

  const splitter = minimized ? null : (
    <div
      role="separator"
      aria-orientation={horizontalDock ? "vertical" : "horizontal"}
      aria-label={`Resize ${dock}-docked console`}
      title={`Drag to resize the ${dock}-docked console`}
      onPointerDown={startResize}
      style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        width: horizontalDock ? SPLITTER_SIZE : "100%",
        height: horizontalDock ? "100%" : SPLITTER_SIZE,
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        background:
          "var(--console-resize-separator-background, #161b22)",
        color:
          "var(--console-resize-separator-foreground, #8b949e)",
        cursor: horizontalDock ? "col-resize" : "row-resize",
        touchAction: "none",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border:
            "1px solid var(--console-resize-separator-border, #3d444d)",
          borderRadius:
            "var(--console-resize-separator-grip-radius, 4px)",
          padding: 1,
          background:
            "var(--console-resize-separator-grip-background, #21262d)",
          pointerEvents: "none",
        }}
      >
        {horizontalDock ? (
          <GripVertical size={14} aria-hidden="true" />
        ) : (
          <GripHorizontal size={14} aria-hidden="true" />
        )}
      </span>
    </div>
  );

  const editorPane = (
    <div
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
        <Editor
          path="file:///src/App.tsx"
          language="typescript"
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

  const dockedConsoleTrack = minimized
    ? horizontalDock
      ? "38px"
      : "38px"
    : `${consoleSize}px`;
  const splitTrack = minimized ? "" : ` ${SPLITTER_SIZE}px`;

  const workspaceStyle =
    dock === "left"
      ? {
          gridTemplateColumns: `${dockedConsoleTrack}${splitTrack} minmax(0, 1fr)`,
          gridTemplateRows: "minmax(0, 1fr)",
        }
      : dock === "right"
        ? {
            gridTemplateColumns: `minmax(0, 1fr)${splitTrack} ${dockedConsoleTrack}`,
            gridTemplateRows: "minmax(0, 1fr)",
          }
        : dock === "top"
          ? {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: `${dockedConsoleTrack}${splitTrack} minmax(0, 1fr)`,
            }
          : {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: `minmax(0, 1fr)${splitTrack} ${dockedConsoleTrack}`,
            };

  const panes =
    dock === "left" || dock === "top"
      ? [consolePane, splitter, editorPane]
      : [editorPane, splitter, consolePane];

  return (
    <div
      style={{
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
        "--console-resize-separator-background": "#161b22",
        "--console-resize-separator-foreground": "#8b949e",
        "--console-resize-separator-border": "#3d444d",
        "--console-resize-separator-grip-background": "#21262d",
        "--console-resize-separator-grip-radius": "4px",
      } as CSSProperties}
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

        <span aria-hidden="true" style={{ whiteSpace: "nowrap" }}>
          Dock:
        </span>

        {DOCK_OPTIONS.map(({ position, label, icon: Icon }) => (
          <button
            key={position}
            type="button"
            aria-label={`Dock console ${position}`}
            aria-pressed={dock === position}
            title={`Dock console ${position}`}
            onClick={() => {
              setDock(position);
              setMinimized(false);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setMinimized((value) => !value)}
          style={{ whiteSpace: "nowrap" }}
        >
          {minimized ? "Restore console" : "Minimize console"}
        </button>
      </div>

      <div
        ref={workspaceRef}
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
