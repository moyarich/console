import type { CSSProperties } from "react";
import { parseAnsi } from "../utils/ansi";

export interface ConsoleStdoutEntry {
  id?: string;
  data: string;
}

export interface ConsoleStdoutProps {
  entries: readonly (ConsoleStdoutEntry | string)[];
  emptyMessage?: string;
}

export function ConsoleStdout({
  entries,
  emptyMessage = "No stdout output yet.",
}: ConsoleStdoutProps) {
  if (!entries.length) {
    return <div className="console-stdout-empty">{emptyMessage}</div>;
  }

  return (
    <div className="console-stdout-list">
      {entries.map((entry, index) => {
        const data = typeof entry === "string" ? entry : entry.data;
        const key =
          typeof entry === "string"
            ? `stdout-${index}`
            : (entry.id ?? `stdout-${index}`);

        return (
          <pre className="console-stdout-line" key={key}>
            {parseAnsi(data).map((segment, segmentIndex) => (
              <span key={segmentIndex} style={segment.style as CSSProperties}>
                {segment.text}
              </span>
            ))}
          </pre>
        );
      })}
    </div>
  );
}
