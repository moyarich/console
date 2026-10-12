import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import type { ConsoleStdoutEntry } from "@moyarich/console";
import "@xterm/xterm/css/xterm.css";
import "./XtermOutput.css";

/** Terminal instance lifecycle is owned by the addon; incoming source chunks remain immutable. */
/** Whether retained terminal chunks can be appended without replaying prior output. */
export function isAppendOnly(
  previous: readonly (ConsoleStdoutEntry | string)[],
  next: readonly (ConsoleStdoutEntry | string)[],
): boolean {
  return previous.length <= next.length && previous.every((entry, i) => {
    const current = next[i];
    return entry === current || (
      typeof entry !== "string" && typeof current !== "string" &&
      current !== undefined &&
      entry.id === current.id &&
      entry.data === current.data &&
      entry.stream === current.stream
    );
  });
}

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
    terminal.current = instance;
    written.current = [];
    return () => {
      generation.current++;
      terminal.current = null;
      written.current = [];
      instance.dispose();
    };
  }, []);
  useEffect(() => {
    const instance = terminal.current;
    if (!instance) return;
    // Replays on replacement, clearing, or changed historical chunks. Append-only
    // updates write only new entries, preserving cursor and terminal state.
    const old = written.current;
    const appendOnly =
      old.length <= entries.length &&
      old.every(
        (entry, i) =>
          entry === entries[i] ||
          (typeof entry !== "string" &&
            typeof entries[i] !== "string" &&
            entry.id === (entries[i] as ConsoleStdoutEntry).id &&
            entry.data === (entries[i] as ConsoleStdoutEntry).data &&
            entry.stream === (entries[i] as ConsoleStdoutEntry).stream),
      );
    if (!appendOnly) instance.reset();
    const start = appendOnly ? old.length : 0;
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
}    const appendOnly = isAppendOnly(old, entries);
    if (!appendOnly) instance.reset();
    const start = appendOnly ? old.length : 0;
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
