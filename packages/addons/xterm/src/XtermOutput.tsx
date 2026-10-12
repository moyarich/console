import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import type { ConsoleStdoutEntry } from "@moyarich/console";
import "@xterm/xterm/css/xterm.css";
import "./XtermOutput.css";

/** Decide when new output can be appended without replaying prior chunks. */
export function isAppendOnly(
  previous: readonly (ConsoleStdoutEntry | string)[],
  next: readonly (ConsoleStdoutEntry | string)[],
): boolean {
  return (
    previous.length <= next.length &&
    previous.every((entry, i) => {
      const current = next[i];
      return (
        entry === current ||
        (typeof entry !== "string" &&
          typeof current !== "string" &&
          current !== undefined &&
          entry.id === current.id &&
          entry.data === current.data &&
          entry.stream === current.stream)
      );
    })
  );
}

/** The addon owns terminal creation, updates, and disposal. */
export function XtermOutput({
  entries,
}: {
  entries: readonly (ConsoleStdoutEntry | string)[];
}) {
  const element = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const written = useRef<readonly (ConsoleStdoutEntry | string)[]>([]);

  useEffect(() => {
    if (!element.current) return;
    const instance = new Terminal({
      convertEol: true,
      disableStdin: true,
      screenReaderMode: true,
      scrollback: 5000,
    });
    instance.open(element.current);
    const container = element.current;
    const resizeToContainer = () => {
      const screen = instance.element?.querySelector<HTMLElement>(".xterm-screen");
      if (!screen || !container.isConnected) return;
      const cellWidth = screen.offsetWidth / instance.cols;
      const cellHeight = screen.offsetHeight / instance.rows;
      if (cellWidth <= 0 || cellHeight <= 0) return;
      // Match the 0.5rem padding on each side of the xterm element.
      const xtermElement = instance.element;
      const styles = xtermElement ? getComputedStyle(xtermElement) : null;
      const horizontalPadding = styles ? parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight) : 0;
      const verticalPadding = styles ? parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) : 0;
      const cols = Math.max(2, Math.floor((container.clientWidth - horizontalPadding) / cellWidth));
      const rows = Math.max(1, Math.floor((container.clientHeight - verticalPadding) / cellHeight));
      if (cols !== instance.cols || rows !== instance.rows) instance.resize(cols, rows);
    };
    resizeToContainer();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resizeToContainer);
    observer?.observe(container);
    terminal.current = instance;
    written.current = [];
    return () => {
      observer?.disconnect();
      terminal.current = null;
      written.current = [];
      instance.dispose();
    };
  }, []);

  useEffect(() => {
    const instance = terminal.current;
    if (!instance) return;
    const appendOnly = isAppendOnly(written.current, entries);
    if (!appendOnly) instance.reset();
    const start = appendOnly ? written.current.length : 0;
    for (let i = start; i < entries.length; i++) {
      const entry = entries[i]!;
      instance.write(typeof entry === "string" ? entry : entry.data);
    }
    written.current = [...entries];
  }, [entries]);

  return (
    <div
      ref={element}
      className="console-xterm-output"
      aria-label="Terminal output"
    />
  );
}
