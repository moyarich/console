import type { ReactNode } from "react";
import {
  ConsoleStdout,
  type ConsoleStdoutEntry,
  type ConsoleStdoutProps,
} from "./ConsoleStdout";

/**
 * Semantic process-output component for documentation, runners, terminals,
 * build output, and other process-oriented surfaces.
 */
export interface ProcessOutputProps
  extends Omit<ConsoleStdoutProps, "entries"> {
  /** Process output to render. Strings are treated as stdout text. */
  children?: ReactNode;
  /** Explicit ordered process-output entries. */
  entries?: readonly (ConsoleStdoutEntry | string)[];
}

function childrenToEntries(children: ReactNode): readonly string[] {
  if (children === undefined || children === null || children === false) {
    return [];
  }

  return [String(children)];
}

/**
 * Renders process output using Console's ANSI, structured-output, link, and
 * processor pipeline.
 */
export function ProcessOutput({
  children,
  entries,
  ...props
}: ProcessOutputProps) {
  return (
    <ConsoleStdout
      {...props}
      entries={entries ?? childrenToEntries(children)}
    />
  );
}
