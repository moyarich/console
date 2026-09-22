import { GripHorizontal, GripVertical, MoveDiagonal2 } from "lucide-react";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
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

const MIN_WIDTH = 320;
const MIN_HEIGHT = 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function ResizableConsoleExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizable, setResizable] = useState<ResizeDirection>("both");
  const [width, setWidth] = useState(720);
  const [height, setHeight] = useState(300);

  const allowsHorizontal =
    resizable === "horizontal" ||
    resizable === "both" ||
    resizable === "inline";
  const allowsVertical =
    resizable === "vertical" || resizable === "both" || resizable === "block";

  const startResize = (
    event: PointerEvent<HTMLDivElement>,
    axis: "horizontal" | "vertical" | "both",
  ) => {
    event.preventDefault();

    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = width;
    const startHeight = height;
    const maxWidth = bounds.width;
    const maxHeight = 600;

    const handlePointerMove = (pointerEvent: globalThis.PointerEvent) => {
      if (axis === "horizontal" || axis === "both") {
        setWidth(
          clamp(
            startWidth + pointerEvent.clientX - startX,
            MIN_WIDTH,
            maxWidth,
          ),
        );
      }

      if (axis === "vertical" || axis === "both") {
        setHeight(
          clamp(
            startHeight + pointerEvent.clientY - startY,
            MIN_HEIGHT,
            maxHeight,
          ),
        );
      }
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor =
      axis === "both"
        ? "nwse-resize"
        : axis === "horizontal"
          ? "col-resize"
          : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
  };

  return (
    <div
      ref={containerRef}
      style={
        {
          width: "100%",
          minWidth: 0,
          "--console-resize-separator-background": "#f8fafc",
          "--console-resize-separator-foreground": "#475467",
          "--console-resize-separator-border": "#98a2b3",
          "--console-resize-separator-grip-background": "#ffffff",
        } as CSSProperties
      }
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
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

        <span style={{ fontSize: 12 }}>
          Drag the visible grip. The cursor changes to match the resize axis.
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width,
          maxWidth: "100%",
          height,
          minWidth: MIN_WIDTH,
          minHeight: MIN_HEIGHT,
          maxHeight: 600,
        }}
      >
        <Console
          messages={messages}
          autoScroll={false}
          title="Resizable console"
          subtitle="Host-managed visible resize grips around the console shell."
          style={{
            width: "100%",
            height: "100%",
            minWidth: 0,
            minHeight: 0,
          }}
        />

        {allowsHorizontal && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize console horizontally"
            title="Drag to resize horizontally"
            onPointerDown={(event) => startResize(event, "horizontal")}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 3,
              display: "flex",
              width: 10,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              background:
                "var(--console-resize-separator-background, transparent)",
              color: "var(--console-resize-separator-foreground, currentColor)",
              cursor: "col-resize",
              touchAction: "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                border:
                  "1px solid var(--console-resize-separator-border, currentColor)",
                borderRadius: 4,
                padding: 1,
                background:
                  "var(--console-resize-separator-grip-background, transparent)",
                color: "inherit",
                pointerEvents: "none",
              }}
            >
              <GripVertical size={14} aria-hidden="true" />
            </span>
          </div>
        )}

        {allowsVertical && (
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize console vertically"
            title="Drag to resize vertically"
            onPointerDown={(event) => startResize(event, "vertical")}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              zIndex: 3,
              display: "flex",
              width: "100%",
              height: 10,
              alignItems: "center",
              justifyContent: "center",
              background:
                "var(--console-resize-separator-background, transparent)",
              color: "var(--console-resize-separator-foreground, currentColor)",
              cursor: "row-resize",
              touchAction: "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                border:
                  "1px solid var(--console-resize-separator-border, currentColor)",
                borderRadius: 4,
                padding: 1,
                background:
                  "var(--console-resize-separator-grip-background, transparent)",
                color: "inherit",
                pointerEvents: "none",
              }}
            >
              <GripHorizontal size={14} aria-hidden="true" />
            </span>
          </div>
        )}

        {resizable === "both" && (
          <div
            role="separator"
            aria-label="Resize console in both directions"
            title="Drag to resize width and height"
            onPointerDown={(event) => startResize(event, "both")}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              zIndex: 4,
              display: "flex",
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              borderTopLeftRadius: 6,
              border:
                "1px solid var(--console-resize-separator-border, currentColor)",
              background:
                "var(--console-resize-separator-grip-background, transparent)",
              color: "var(--console-resize-separator-foreground, currentColor)",
              cursor: "nwse-resize",
              touchAction: "none",
            }}
          >
            <MoveDiagonal2 size={15} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
