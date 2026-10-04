import type { ReactNode } from "react";
import {
  ConsoleStdout,
  type ConsoleStdoutEntry,
  type ConsoleStdoutProps,
} from "./ConsoleStdout";

/** One ordered terminal output item. */
export type TerminalOutputEntry = ConsoleStdoutEntry;

/** Props for terminal-style sequential text output. */
export interface TerminalProps extends Omit<ConsoleStdoutProps, "entries"> {
  /** Terminal output. Strings are treated as stdout text. */
  output?: readonly (TerminalOutputEntry | string)[];
  /** Plain child content used when output is omitted. */
  children?: ReactNode;
}

function childrenToOutput(children: ReactNode): readonly string[] {
  if (children === undefined || children === null || children === false) {
    return [];
  }
  return [String(children)];
}

/**
 * Renders terminal output including stdout/stderr, ANSI styling, control
 * sequences, links, processors, and optionally structured values.
 */
export function Terminal({ output, children, ...props }: TerminalProps) {
  return (
    <ConsoleStdout
      {...props}
      entries={output ?? childrenToOutput(children)}
    />
  );
}
