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
  const [hoveredAxis, setHoveredAxis] = useState<
    "horizontal" | "vertical" | "both" | null
  >(null);
  const [activeAxis, setActiveAxis] = useState<
    "horizontal" | "vertical" | "both" | null
  >(null);

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
      setActiveAxis(null);
    };

    setActiveAxis(axis);
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
          "--console-resize-separator-line": "#d0d5dd",
          "--console-resize-separator-hover": "#98a2b3",
          "--console-resize-separator-active": "#475467",
          "--console-resize-separator-foreground": "#667085",
          "--console-resize-separator-border": "#d0d5dd",
          "--console-resize-separator-grip-background": "#ffffff",
          "--console-resize-separator-grip-radius": "999px",
          "--console-resize-separator-grip-shadow":
            "0 2px 8px rgb(16 24 40 / 0.14)",
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
            tabIndex={0}
            onPointerDown={(event) => startResize(event, "horizontal")}
            onPointerEnter={() => setHoveredAxis("horizontal")}
            onPointerLeave={() => setHoveredAxis(null)}
            onFocus={() => setHoveredAxis("horizontal")}
            onBlur={() => setHoveredAxis(null)}
            style={{
              position: "absolute",
              top: 0,
              right: -5,
              zIndex: 3,
              display: "flex",
              width: 10,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--console-resize-separator-foreground, currentColor)",
              cursor: "col-resize",
              outline: "none",
              touchAction: "none",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 1,
                height: "100%",
                background:
                  activeAxis === "horizontal"
                    ? "var(--console-resize-separator-active, currentColor)"
                    : hoveredAxis === "horizontal"
                      ? "var(--console-resize-separator-hover, currentColor)"
                      : "var(--console-resize-separator-line, currentColor)",
                pointerEvents: "none",
                transition: "background 120ms ease",
              }}
            />
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                width: 22,
                height: 34,
                alignItems: "center",
                justifyContent: "center",
                border:
                  hoveredAxis === "horizontal" || activeAxis === "horizontal"
                    ? "1px solid var(--console-resize-separator-border, currentColor)"
                    : "1px solid transparent",
                borderRadius:
                  "var(--console-resize-separator-grip-radius, 999px)",
                background:
                  hoveredAxis === "horizontal" || activeAxis === "horizontal"
                    ? "var(--console-resize-separator-grip-background, transparent)"
                    : "transparent",
                boxShadow:
                  hoveredAxis === "horizontal" || activeAxis === "horizontal"
                    ? "var(--console-resize-separator-grip-shadow, none)"
                    : "none",
                color:
                  activeAxis === "horizontal"
                    ? "var(--console-resize-separator-active, currentColor)"
                    : "inherit",
                opacity:
                  hoveredAxis === "horizontal" || activeAxis === "horizontal"
                    ? 1
                    : 0.55,
                pointerEvents: "none",
                transition:
                  "opacity 120ms ease, background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease",
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
            tabIndex={0}
            onPointerDown={(event) => startResize(event, "vertical")}
            onPointerEnter={() => setHoveredAxis("vertical")}
            onPointerLeave={() => setHoveredAxis(null)}
            onFocus={() => setHoveredAxis("vertical")}
            onBlur={() => setHoveredAxis(null)}
            style={{
              position: "absolute",
              right: 0,
              bottom: -5,
              zIndex: 3,
              display: "flex",
              width: "100%",
              height: 10,
              alignItems: "center",
              justifyContent: "center",
              color: "var(--console-resize-separator-foreground, currentColor)",
              cursor: "row-resize",
              outline: "none",
              touchAction: "none",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                width: "100%",
                height: 1,
                background:
                  activeAxis === "vertical"
                    ? "var(--console-resize-separator-active, currentColor)"
                    : hoveredAxis === "vertical"
                      ? "var(--console-resize-separator-hover, currentColor)"
                      : "var(--console-resize-separator-line, currentColor)",
                pointerEvents: "none",
                transition: "background 120ms ease",
              }}
            />
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                width: 34,
                height: 22,
                alignItems: "center",
                justifyContent: "center",
                border:
                  hoveredAxis === "vertical" || activeAxis === "vertical"
                    ? "1px solid var(--console-resize-separator-border, currentColor)"
                    : "1px solid transparent",
                borderRadius:
                  "var(--console-resize-separator-grip-radius, 999px)",
                background:
                  hoveredAxis === "vertical" || activeAxis === "vertical"
                    ? "var(--console-resize-separator-grip-background, transparent)"
                    : "transparent",
                boxShadow:
                  hoveredAxis === "vertical" || activeAxis === "vertical"
                    ? "var(--console-resize-separator-grip-shadow, none)"
                    : "none",
                color:
                  activeAxis === "vertical"
                    ? "var(--console-resize-separator-active, currentColor)"
                    : "inherit",
                opacity:
                  hoveredAxis === "vertical" || activeAxis === "vertical"
                    ? 1
                    : 0.55,
                pointerEvents: "none",
                transition:
                  "opacity 120ms ease, background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease",
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
            tabIndex={0}
            onPointerDown={(event) => startResize(event, "both")}
            onPointerEnter={() => setHoveredAxis("both")}
            onPointerLeave={() => setHoveredAxis(null)}
            onFocus={() => setHoveredAxis("both")}
            onBlur={() => setHoveredAxis(null)}
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              zIndex: 4,
              display: "flex",
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
              border:
                hoveredAxis === "both" || activeAxis === "both"
                  ? "1px solid var(--console-resize-separator-border, currentColor)"
                  : "1px solid transparent",
              borderRadius: 8,
              background:
                hoveredAxis === "both" || activeAxis === "both"
                  ? "var(--console-resize-separator-grip-background, transparent)"
                  : "transparent",
              boxShadow:
                hoveredAxis === "both" || activeAxis === "both"
                  ? "var(--console-resize-separator-grip-shadow, none)"
                  : "none",
              color:
                activeAxis === "both"
                  ? "var(--console-resize-separator-active, currentColor)"
                  : "var(--console-resize-separator-foreground, currentColor)",
              cursor: "nwse-resize",
              opacity:
                hoveredAxis === "both" || activeAxis === "both" ? 1 : 0.65,
              outline: "none",
              touchAction: "none",
              transition:
                "opacity 120ms ease, background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease",
            }}
          >
            <MoveDiagonal2 size={15} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
