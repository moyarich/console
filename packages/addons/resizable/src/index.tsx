import { GripHorizontal, GripVertical, MoveDiagonal2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleFrameDecorator,
  type ConsoleMode,
} from "@moyarich/console-core";

/** Stable package-qualified identity for the resizable frame addon. */
export const RESIZABLE_CONSOLE_ADDON_ID = "@moyarich/console-addon-resizable";

export type ConsoleResizeDirection =
  | "vertical"
  | "horizontal"
  | "both"
  | "block"
  | "inline";

export type ConsoleResizeEdge = "start" | "end";

export interface ConsoleResizeSize {
  width: number;
  height: number;
}

export interface ResizableConsoleAddonOptions {
  /** Resize axis. Logical block/inline map to vertical/horizontal in the default writing mode. @default "both" */
  direction?: ConsoleResizeDirection;
  /** Initial width used when horizontal resizing is active. @default 720 */
  defaultWidth?: number | string;
  /** Initial height used when vertical resizing is active. @default 300 */
  defaultHeight?: number | string;
  /** Minimum width while dragging. @default 320 */
  minWidth?: number;
  /** Minimum height while dragging. @default 180 */
  minHeight?: number;
  /** Optional maximum width while dragging. The parent width is always respected. */
  maxWidth?: number;
  /** Optional maximum height while dragging. */
  maxHeight?: number;
  /** Physical edge that owns the horizontal resize handle. @default "end" */
  horizontalEdge?: ConsoleResizeEdge;
  /** Physical edge that owns the vertical resize handle. @default "end" */
  verticalEdge?: ConsoleResizeEdge;
  /** Additional class name applied to the addon-owned frame. */
  className?: string;
  /** Additional inline styles and CSS custom-property overrides applied to the addon-owned frame. */
  style?: CSSProperties;
  /** Called whenever a drag updates the rendered frame size. */
  onResize?: (size: ConsoleResizeSize) => void;
}

type ResizeAxis = "horizontal" | "vertical" | "both";

interface ResizeAxes {
  horizontal: boolean;
  vertical: boolean;
}

interface ResizeDrag {
  axis: ResizeAxis;
  pointerId: number;
  target: HTMLElement;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  maxWidth: number;
  maxHeight: number;
}

interface ResizableConsoleFrameProps {
  mode: ConsoleMode;
  options: ResizableConsoleAddonOptions;
  children: ReactNode;
}

export function resolveConsoleResizeAxes(
  direction: ConsoleResizeDirection,
): ResizeAxes {
  return {
    horizontal:
      direction === "horizontal" ||
      direction === "both" ||
      direction === "inline",
    vertical:
      direction === "vertical" || direction === "both" || direction === "block",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getCornerCursor(
  horizontalEdge: ConsoleResizeEdge,
  verticalEdge: ConsoleResizeEdge,
) {
  return horizontalEdge === verticalEdge ? "nwse-resize" : "nesw-resize";
}

function toCssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

function ResizableConsoleFrame({
  mode,
  options,
  children,
}: ResizableConsoleFrameProps) {
  const {
    direction = "both",
    defaultWidth = 720,
    defaultHeight = 300,
    minWidth = 320,
    minHeight = 180,
    maxWidth,
    maxHeight,
    horizontalEdge = "end",
    verticalEdge = "end",
    className = "",
    style,
    onResize,
  } = options;
  const axes = resolveConsoleResizeAxes(direction);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ResizeDrag | null>(null);
  const bodyStyleRef = useRef<{ cursor: string; userSelect: string } | null>(
    null,
  );
  const [width, setWidth] = useState<number | string>(defaultWidth);
  const [height, setHeight] = useState<number | string>(defaultHeight);
  const [activeAxis, setActiveAxis] = useState<ResizeAxis | null>(null);

  const restoreBodyStyles = useCallback(() => {
    if (typeof document === "undefined" || !bodyStyleRef.current) {
      return;
    }

    document.body.style.cursor = bodyStyleRef.current.cursor;
    document.body.style.userSelect = bodyStyleRef.current.userSelect;
    bodyStyleRef.current = null;
  }, []);

  const stopResize = useCallback(
    (event?: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;

      if (
        drag &&
        event &&
        drag.pointerId === event.pointerId &&
        drag.target.hasPointerCapture(event.pointerId)
      ) {
        drag.target.releasePointerCapture(event.pointerId);
      }

      dragRef.current = null;
      setActiveAxis(null);
      restoreBodyStyles();
    },
    [restoreBodyStyles],
  );

  useEffect(
    () => () => {
      dragRef.current = null;
      restoreBodyStyles();
    },
    [restoreBodyStyles],
  );

  useEffect(() => {
    if (!dragRef.current) {
      return;
    }

    dragRef.current = null;
    setActiveAxis(null);
    restoreBodyStyles();
  }, [direction, restoreBodyStyles]);

  const startResize = (event: PointerEvent<HTMLElement>, axis: ResizeAxis) => {
    event.preventDefault();

    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const bounds = frame.getBoundingClientRect();
    const parentBounds = frame.parentElement?.getBoundingClientRect();
    const parentMaxWidth = parentBounds?.width ?? Number.POSITIVE_INFINITY;
    const resolvedMaxWidth = Math.min(
      maxWidth ?? parentMaxWidth,
      parentMaxWidth,
    );
    const resolvedMaxHeight = maxHeight ?? Number.POSITIVE_INFINITY;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      axis,
      pointerId: event.pointerId,
      target: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: bounds.width,
      startHeight: bounds.height,
      maxWidth: resolvedMaxWidth,
      maxHeight: resolvedMaxHeight,
    };
    setActiveAxis(axis);

    if (typeof document !== "undefined") {
      bodyStyleRef.current = {
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect,
      };

      document.body.style.cursor =
        axis === "both"
          ? getCornerCursor(horizontalEdge, verticalEdge)
          : axis === "horizontal"
            ? "col-resize"
            : "row-resize";
      document.body.style.userSelect = "none";
    }
  };

  const moveResize = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    let nextWidth = drag.startWidth;
    let nextHeight = drag.startHeight;

    if (drag.axis === "horizontal" || drag.axis === "both") {
      const directionMultiplier = horizontalEdge === "end" ? 1 : -1;
      nextWidth = clamp(
        drag.startWidth + (event.clientX - drag.startX) * directionMultiplier,
        minWidth,
        drag.maxWidth,
      );
      setWidth(nextWidth);
    }

    if (drag.axis === "vertical" || drag.axis === "both") {
      const directionMultiplier = verticalEdge === "end" ? 1 : -1;
      nextHeight = clamp(
        drag.startHeight + (event.clientY - drag.startY) * directionMultiplier,
        minHeight,
        drag.maxHeight,
      );
      setHeight(nextHeight);
    }

    onResize?.({
      width: nextWidth,
      height: nextHeight,
    });
  };

  const renderHorizontalHandle = () => {
    if (!axes.horizontal) {
      return null;
    }

    return (
      <div
        className="console-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize console horizontally"
        title="Drag to resize horizontally"
        tabIndex={0}
        data-console-resize-axis="horizontal"
        data-active={activeAxis === "horizontal" || undefined}
        onPointerDown={(event) => startResize(event, "horizontal")}
        onPointerMove={moveResize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      >
        <span className="console-resize-line" aria-hidden="true" />
        <span className="console-resize-grip" aria-hidden="true">
          <GripVertical size={14} />
        </span>
      </div>
    );
  };

  const renderVerticalHandle = () => {
    if (!axes.vertical) {
      return null;
    }

    return (
      <div
        className="console-resize-handle"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize console vertically"
        title="Drag to resize vertically"
        tabIndex={0}
        data-console-resize-axis="vertical"
        data-active={activeAxis === "vertical" || undefined}
        onPointerDown={(event) => startResize(event, "vertical")}
        onPointerMove={moveResize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      >
        <span className="console-resize-line" aria-hidden="true" />
        <span className="console-resize-grip" aria-hidden="true">
          <GripHorizontal size={14} />
        </span>
      </div>
    );
  };

  const renderCornerHandle = () => {
    if (direction !== "both") {
      return null;
    }

    return (
      <div
        className="console-resize-corner-handle"
        role="separator"
        aria-label="Resize console in both directions"
        title="Drag to resize width and height"
        tabIndex={0}
        data-console-resize-axis="both"
        data-active={activeAxis === "both" || undefined}
        onPointerDown={(event) => startResize(event, "both")}
        onPointerMove={moveResize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      >
        <MoveDiagonal2 size={15} aria-hidden="true" />
      </div>
    );
  };

  return (
    <div
      ref={frameRef}
      className={`console-resizable-frame ${className}`.trim()}
      data-console-resize-direction={direction}
      data-console-resize-horizontal-edge={horizontalEdge}
      data-console-resize-vertical-edge={verticalEdge}
      data-console-mode={mode}
      style={
        {
          "--_console-resizable-width": toCssSize(width),
          "--_console-resizable-height": toCssSize(height),
          "--_console-resizable-min-width": `${minWidth}px`,
          "--_console-resizable-min-height": `${minHeight}px`,
          "--_console-resizable-max-width":
            maxWidth === undefined ? "100%" : `${maxWidth}px`,
          "--_console-resizable-max-height":
            maxHeight === undefined ? "100%" : `${maxHeight}px`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="console-resizable-frame-content">{children}</div>

      {renderHorizontalHandle()}
      {renderVerticalHandle()}
      {renderCornerHandle()}
    </div>
  );
}

/**
 * Creates a first-party frame-resizing addon.
 *
 * The addon contributes a generic frame decorator and leaves message/output
 * rendering, viewport state, and host layout ownership unchanged.
 */
export function createResizableConsoleAddon(
  options: ResizableConsoleAddonOptions = {},
): ConsoleAddon {
  const decorator: ConsoleFrameDecorator = {
    render(context) {
      return (
        <ResizableConsoleFrame mode={context.mode} options={options}>
          {context.renderDefault() as ReactNode}
        </ResizableConsoleFrame>
      );
    },
  };

  return {
    id: RESIZABLE_CONSOLE_ADDON_ID,

    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.frameDecorator,
        decorator,
        {
          id: `${RESIZABLE_CONSOLE_ADDON_ID}:frame`,
        },
      );
    },
  };
}
