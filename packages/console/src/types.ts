import type { ConsoleMethod } from "./consoleMethods";

export type { ConsoleMethod } from "./consoleMethods";

export interface ConsoleMessageData {
  id?: string;
  method: ConsoleMethod;
  data: unknown[];
  depth: number;
  timestamp?: number;
  source?: string;
  columns?: string[];
  expandLevel?: number;
  showNonenumerable?: boolean;
}

export interface RunOutput {
  messages: ConsoleMessageData[];
  error?: string;
}
export interface DirOptions {
  depth?: number | null;
  showHidden?: boolean;
}
export type ConsoleEvent =
  | { type: "message"; message: ConsoleMessageData }
  | { type: "clear" };
export type ConsoleEventHandler = (event: ConsoleEvent) => void;
export interface ConsoleTransportEnvelope {
  type: "CONSOLE_PANEL";
  version: 1;
  channel: string;
  event: ConsoleEvent;
}
