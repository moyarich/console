import type { ConsoleMethod } from "./console/consoleMethods";

export type { ConsoleMethod } from "./console/consoleMethods";

/** Rendering mode shared by console presentation and extension APIs. */
export type ConsoleMode = "console" | "ansi";

/** Serializable structured message shared by producers, transports, and renderers. */
export interface ConsoleMessageData {
  /** Optional stable identifier used for keys, deduplication, and transports. */
  id?: string;
  /** Console method that determines rendering semantics. */
  method: ConsoleMethod;
  /** Arguments captured for the console call. */
  data: unknown[];
  /** Group nesting depth at the time the message was emitted. */
  depth: number;
  /** Optional epoch timestamp in milliseconds. */
  timestamp?: number;
  /** Optional source identifier such as a frame, runtime, or file location. */
  source?: string;
  /** Requested columns for `console.table()`. */
  columns?: string[];
  /** Initial object-expansion depth for directory-style output. */
  expandLevel?: number;
  /** Whether directory output should include non-enumerable properties. */
  showNonenumerable?: boolean;
}

/** Event shared by console producers, event emitters, and transports. */
export type ConsoleEvent =
  | { type: "message"; message: ConsoleMessageData }
  | { type: "clear" };
