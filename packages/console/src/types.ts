import type { ConsoleMethod } from "./console/consoleMethods";

export type { ConsoleMethod } from "./console/consoleMethods";

/** Rendering mode supported by the top-level Console component. */
export type ConsoleMode = "console" | "ansi";

/** Serializable structured message consumed by the browser-style console renderer. */
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

/** Standard run result shape accepted by structured console mode. */
export interface RunOutput {
  messages: ConsoleMessageData[];
  error?: string;
}
/** Supported `console.dir()` options used by the console proxy. */
export interface DirOptions {
  depth?: number | null;
  showHidden?: boolean;
}
/** Event emitted by console capture/proxy utilities and transports. */
export type ConsoleEvent =
  { type: "message"; message: ConsoleMessageData } | { type: "clear" };
/** Versioned envelope used to move console events across transport boundaries. */
export interface ConsoleTransportEnvelope {
  type: "CONSOLE_PANEL";
  version: 1;
  channel: string;
  event: ConsoleEvent;
}
