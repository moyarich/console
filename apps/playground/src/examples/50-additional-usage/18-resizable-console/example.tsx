import { useRef, useState, type PointerEvent } from "react";
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

function GripIcon({
  direction,
}: {
  direction: "horizontal" | "vertical" | "both";
}) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      {direction === "horizontal" ? (
        <>
          <circle cx="5" cy="4" r="1" fill="currentColor" />
          <circle cx="10" cy="4" r="1" fill="currentColor" />
          <circle cx="5" cy="8" r="1" fill="currentColor" />
          <circle cx="10" cy="8" r="1" fill="currentColor" />
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="10" cy="12" r="1" fill="currentColor" />
        </>
      ) : direction === "vertical" ? (
        <>
          <circle cx="4" cy="5" r="1" fill="currentColor" />
          <circle cx="8" cy="5" r="1" fill="currentColor" />
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="4" cy="10" r="1" fill="currentColor" />
          <circle cx="8" cy="10" r="1" fill="currentColor" />
          <circle cx="12" cy="10" r="1" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M5 10 10 5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 12 12 7" stroke="currentColor" strokeWidth="1.4" />
        </>
      )}
    </svg>
  );
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
    <div ref={containerRef} style={{ width: "100%", minWidth: 0 }}>
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
              cursor: "col-resize",
              touchAction: "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                border: "1px solid #667085",
                borderRadius: 4,
                padding: 1,
                background: "#fff",
                color: "#344054",
                pointerEvents: "none",
              }}
            >
              <GripIcon direction="horizontal" />
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
              cursor: "row-resize",
              touchAction: "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                border: "1px solid #667085",
                borderRadius: 4,
                padding: 1,
                background: "#fff",
                color: "#344054",
                pointerEvents: "none",
              }}
            >
              <GripIcon direction="vertical" />
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
              background: "#fff",
              color: "#344054",
              cursor: "nwse-resize",
              touchAction: "none",
            }}
          >
            <GripIcon direction="both" />
          </div>
        )}
      </div>
    </div>
  );
}
