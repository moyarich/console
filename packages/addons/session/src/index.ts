import { deserializeConsoleMessage, serializeConsoleMessage, type ConsoleMessageData, type ConsoleStdoutEntry } from "@moyarich/console";

export const CONSOLE_SESSION_TYPE = "MOYARICH_CONSOLE_SESSION" as const;
export const CONSOLE_SESSION_VERSION = 1 as const;

export type ConsoleSession =
  | { readonly type: typeof CONSOLE_SESSION_TYPE; readonly version: 1; readonly mode: "console"; readonly messages: readonly ConsoleMessageData[]; readonly droppedCount: number }
  | { readonly type: typeof CONSOLE_SESSION_TYPE; readonly version: 1; readonly mode: "terminal"; readonly entries: readonly (ConsoleStdoutEntry | string)[]; readonly droppedCount: number };

export function createConsoleSession(input:
  | { mode: "console"; messages: readonly ConsoleMessageData[]; droppedCount?: number }
  | { mode: "terminal"; entries: readonly (ConsoleStdoutEntry | string)[]; droppedCount?: number },
): ConsoleSession {
  const droppedCount = input.droppedCount ?? 0;
  if (!Number.isSafeInteger(droppedCount) || droppedCount < 0) throw new RangeError("Invalid droppedCount");
  return input.mode === "console"
    ? { type: CONSOLE_SESSION_TYPE, version: CONSOLE_SESSION_VERSION, mode: "console", droppedCount, messages: input.messages.map(serializeConsoleMessage) }
    : { type: CONSOLE_SESSION_TYPE, version: CONSOLE_SESSION_VERSION, mode: "terminal", droppedCount, entries: input.entries.map((entry) => typeof entry === "string" ? entry : { ...entry }) };
}

export function stringifyConsoleSession(session: ConsoleSession): string {
  return JSON.stringify(session);
}

export function parseConsoleSession(serialized: string | unknown): ConsoleSession {
  const input: unknown = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
  if (!input || typeof input !== "object") throw new TypeError("Invalid console session");
  const record = input as Record<string, unknown>;
  if (record.type !== CONSOLE_SESSION_TYPE) throw new TypeError("Invalid console session type");
  if (record.version !== CONSOLE_SESSION_VERSION) throw new RangeError("Unsupported console session version");
  if (!Number.isSafeInteger(record.droppedCount) || (record.droppedCount as number) < 0) throw new TypeError("Invalid dropped history");
  if (record.mode === "console") {
    if (!Array.isArray(record.messages)) throw new TypeError("Missing console messages");
    for (const message of record.messages) {
      if (!message || typeof message !== "object" || typeof message.method !== "string" || !Array.isArray(message.data) || typeof message.depth !== "number") throw new TypeError("Invalid console message");
    }
    return { type: CONSOLE_SESSION_TYPE, version: 1, mode: "console", droppedCount: record.droppedCount as number, messages: record.messages.map(deserializeConsoleMessage) };
  }
  if (record.mode === "terminal") {
    if (!Array.isArray(record.entries) || !record.entries.every((entry) => typeof entry === "string" || (entry && typeof entry === "object" && typeof entry.data === "string"))) throw new TypeError("Invalid terminal entries");
    return { type: CONSOLE_SESSION_TYPE, version: 1, mode: "terminal", droppedCount: record.droppedCount as number, entries: record.entries };
  }
  throw new TypeError("Unsupported console session mode");
}
