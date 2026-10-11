import {
  consoleServices,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleDataService,
} from "@moyarich/console";
import {
  deserializeConsoleMessage,
  serializeConsoleMessage,
  serializeConsoleValue,
  deserializeConsoleValue,
  type ConsoleMessageData,
  type ConsoleStdoutEntry,
} from "@moyarich/console";

export const CONSOLE_SESSION_TYPE = "MOYARICH_CONSOLE_SESSION" as const;
export const CONSOLE_SESSION_VERSION = 1 as const;

export type ConsoleSession =
  | {
      readonly type: typeof CONSOLE_SESSION_TYPE;
      readonly version: 1;
      readonly mode: "console";
      readonly messages: readonly ConsoleMessageData[];
      readonly droppedCount: number;
    }
  | {
      readonly type: typeof CONSOLE_SESSION_TYPE;
      readonly version: 1;
      readonly mode: "terminal";
      readonly entries: readonly (ConsoleStdoutEntry | string)[];
      readonly droppedCount: number;
    };

export function createConsoleSession(
  input:
    | {
        mode: "console";
        messages: readonly ConsoleMessageData[];
        droppedCount?: number;
      }
    | {
        mode: "terminal";
        entries: readonly (ConsoleStdoutEntry | string)[];
        droppedCount?: number;
      },
): ConsoleSession {
  const droppedCount = input.droppedCount ?? 0;
  if (!Number.isSafeInteger(droppedCount) || droppedCount < 0)
    throw new RangeError("Invalid droppedCount");
  return input.mode === "console"
    ? {
        type: CONSOLE_SESSION_TYPE,
        version: CONSOLE_SESSION_VERSION,
        mode: "console",
        droppedCount,
        messages: input.messages.map(serializeConsoleMessage),
      }
    : {
        type: CONSOLE_SESSION_TYPE,
        version: CONSOLE_SESSION_VERSION,
        mode: "terminal",
        droppedCount,
        entries: input.entries.map((entry) =>
          typeof entry === "string"
            ? entry
            : {
                data: entry.data,
                ...(entry.id !== undefined ? { id: entry.id } : {}),
                ...(entry.stream !== undefined ? { stream: entry.stream } : {}),
                ...(entry.metadata !== undefined
                  ? { metadata: serializeConsoleValue(entry.metadata) as Record<string, unknown> }
                  : {}),
              },
        ),
      };
}

export function stringifyConsoleSession(session: ConsoleSession): string {
  return JSON.stringify(session);
}

export function parseConsoleSession(
  serialized: string | unknown,
): ConsoleSession {
  const input: unknown =
    typeof serialized === "string" ? JSON.parse(serialized) : serialized;
  if (!input || typeof input !== "object")
    throw new TypeError("Invalid console session");
  const record = input as Record<string, unknown>;
  if (record.type !== CONSOLE_SESSION_TYPE)
    throw new TypeError("Invalid console session type");
  if (record.version !== CONSOLE_SESSION_VERSION)
    throw new RangeError("Unsupported console session version");
  if (
    !Number.isSafeInteger(record.droppedCount) ||
    (record.droppedCount as number) < 0
  )
    throw new TypeError("Invalid dropped history");
  if (record.mode === "console") {
    if (!Array.isArray(record.messages))
      throw new TypeError("Missing console messages");
    for (const message of record.messages) {
      if (
        !message ||
        typeof message !== "object" ||
        typeof message.method !== "string" ||
        !Array.isArray(message.data) ||
        !Number.isSafeInteger(message.depth) ||
        message.depth < 0
      )
        throw new TypeError("Invalid console message");
    }
    return {
      type: CONSOLE_SESSION_TYPE,
      version: 1,
      mode: "console",
      droppedCount: record.droppedCount as number,
      messages: record.messages.map(deserializeConsoleMessage),
    };
  }
  if (record.mode === "terminal") {
    if (
      !Array.isArray(record.entries) ||
      !record.entries.every(
        (entry) =>
          typeof entry === "string" ||
          (entry &&
            typeof entry === "object" &&
            typeof entry.data === "string" &&
            (entry.id === undefined || typeof entry.id === "string") &&
            (entry.stream === undefined ||
              entry.stream === "stdout" ||
              entry.stream === "stderr") &&
            (entry.metadata === undefined ||
              (entry.metadata !== null &&
                typeof entry.metadata === "object" &&
                !Array.isArray(entry.metadata)))),
      )
    )
      throw new TypeError("Invalid terminal entries");
    return {
      type: CONSOLE_SESSION_TYPE,
      version: 1,
      mode: "terminal",
      droppedCount: record.droppedCount as number,
      entries: record.entries.map((entry) =>
        typeof entry === "string"
          ? entry
          : {
              ...entry,
              ...(entry.metadata !== undefined
                ? { metadata: deserializeConsoleValue(entry.metadata) as Record<string, unknown> }
                : {}),
            },
      ),
    };
  }
  throw new TypeError("Unsupported console session mode");
}

/** Read-only session snapshot facade exposed while the addon is active. */
export interface ConsoleSessionService {
  capture(droppedCount?: number): ConsoleSession;
  save(droppedCount?: number): string;
  restore(serialized: string): ConsoleSession;
}
export const CONSOLE_SESSION_ADDON_ID = "@moyarich/console-addon-session";
export const consoleSessionService =
  createConsoleServiceToken<ConsoleSessionService>(
    CONSOLE_SESSION_ADDON_ID + ".service",
  );

/** The host owns applying a restored session to source messages; the addon never mutates capture state. */
export function createConsoleSessionAddon(): ConsoleAddon & {
  service: ConsoleSessionService;
} {
  let data: ConsoleDataService | undefined;
  const service: ConsoleSessionService = {
    capture(droppedCount = 0) {
      const snapshot = data?.getSnapshot();
      if (!snapshot) throw new Error("Console session addon is not active");
      return snapshot.mode === "console"
        ? createConsoleSession({
            mode: "console",
            messages: snapshot.all,
            droppedCount,
          })
        : createConsoleSession({
            mode: "terminal",
            entries: snapshot.rawEntries,
            droppedCount,
          });
    },
    save(droppedCount = 0) {
      return stringifyConsoleSession(service.capture(droppedCount));
    },
    restore(serialized) {
      return parseConsoleSession(serialized);
    },
  };
  return {
    id: CONSOLE_SESSION_ADDON_ID,
    service,
    activate(host) {
      data = host.services.get(consoleServices.data);
      host.services.provide(consoleSessionService, service);
      return () => {
        data = undefined;
      };
    },
  };
}
