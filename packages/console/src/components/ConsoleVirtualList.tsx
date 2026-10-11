import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface ConsoleVirtualListProps {
  count: number;
  messageIds?: readonly (string | undefined)[];
  renderRow(index: number): ReactNode;
  /** Approximate row height used before a row can be measured. */
  estimatedRowHeight?: number;
  overscan?: number;
}

/** Calculates logical row boundaries without depending on mounted DOM nodes. */
export function getConsoleVirtualRange(
  offsets: readonly number[],
  scrollTop: number,
  viewportHeight: number,
  overscan = 6,
): { start: number; end: number } {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: 0 };
  let low = 0,
    high = count;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle + 1]! <= scrollTop) low = middle + 1;
    else high = middle;
  }
  const start = Math.max(0, low - overscan);
  let end = Math.max(low, 0);
  while (end < count && offsets[end]! < scrollTop + viewportHeight) end++;
  return { start, end: Math.min(count, end + overscan) };
}

/**
 * Virtualizes console rows within their existing scroll container.
 * Heights are measured as rows mount, preserving variable-height expanded objects.
 */
export function ConsoleVirtualList({
  count,
  messageIds,
  renderRow,
  estimatedRowHeight = 32,
  overscan = 6,
}: ConsoleVirtualListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heights = useRef(new Map<string, number>());
  const [revision, setRevision] = useState(0);
  const [position, setPosition] = useState({ top: 0, height: 600 });
  // Measurements follow logical IDs across filtering and reordering.
  // Index-based fallback IDs are only stable while the input order is stable.
  const rowKeys = useMemo(
    () => Array.from({ length: count }, (_, index) => messageIds?.[index] ?? `__index-${index}`),
    [count, messageIds],
  );
  const offsets = useMemo(() => {
    void revision; // Recalculate offsets when a measured row changes height.
    const result = [0];
    for (let i = 0; i < count; i++) {
      result.push(result[i]! + (heights.current.get(rowKeys[i]!) ?? estimatedRowHeight));
    }
    return result;
  }, [count, estimatedRowHeight, revision, rowKeys]);
  useEffect(() => {
    const root = rootRef.current as
      | (HTMLDivElement & { scrollToConsoleMessage?: (id: string, options?: { block?: ScrollLogicalPosition; behavior?: ScrollBehavior }) => boolean })
      | null;
    const surface = root?.closest<HTMLElement>(".console-surface");
    if (!root || !surface || !messageIds) return;
    root.scrollToConsoleMessage = (id, options) => {
      const index = messageIds.indexOf(id);
      if (index < 0) return false;
      const top = root.getBoundingClientRect().top - surface.getBoundingClientRect().top +
        surface.scrollTop + (offsets[index] ?? 0);
      const height = offsets[index + 1]! - offsets[index]!;
      const block = options?.block ?? "nearest";
      const viewTop = surface.scrollTop;
      const viewBottom = viewTop + surface.clientHeight;
      let target = top;
      if (block === "center") target -= (surface.clientHeight - height) / 2;
      else if (block === "end") target -= surface.clientHeight - height;
      else if (block === "nearest") {
        if (top >= viewTop && top + height <= viewBottom) return true;
        target = top < viewTop ? top : top + height - surface.clientHeight;
      }
      if (typeof surface.scrollTo === "function") {
        surface.scrollTo({ top: Math.max(0, target), behavior: options?.behavior });
      } else {
        surface.scrollTop = Math.max(0, target);
      }
      return true;
    };
    return () => {
      delete root.scrollToConsoleMessage;
    };
  }, [messageIds, offsets]);
  useEffect(() => {
    const surface = rootRef.current?.closest(".console-surface");
    if (!surface) return;
    const update = () => {
      const root = rootRef.current;
      if (!root) return;
      const relativeTop =
        surface.scrollTop - (root.getBoundingClientRect().top -
          surface.getBoundingClientRect().top + surface.scrollTop);
      setPosition({ top: Math.max(0, relativeTop), height: surface.clientHeight });
    };
    update();
    surface.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(surface);
    return () => {
      surface.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);
  const { start, end } = getConsoleVirtualRange(
    offsets,
    position.top,
    position.height,
    overscan,
  );
  return (
    <div
      ref={rootRef}
      data-console-virtual-list=""
      style={{ position: "relative", height: offsets[count] }}
    >
      {Array.from({ length: end - start }, (_, offset) => {
        const index = start + offset;
        return (
          <MeasuredConsoleRow
            key={rowKeys[index]}
            top={offsets[index]!}
            onHeight={(height) => {
              const key = rowKeys[index]!;
              if (heights.current.get(key) === height) return;
              heights.current.set(key, height);
              setRevision((current) => current + 1);
            }}
          >
            {renderRow(index)}
          </MeasuredConsoleRow>
        );
      })}
    </div>
  );
}

function MeasuredConsoleRow({
  top,
  onHeight,
  children,
}: {
  top: number;
  onHeight(height: number): void;
  children: ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;
    const measure = () => onHeight(element.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeight]);
  return (
    <div ref={rowRef} style={{ position: "absolute", top, left: 0, right: 0 }}>
      {children}
    </div>
  );
}
