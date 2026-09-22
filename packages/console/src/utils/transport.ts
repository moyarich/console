import { isConsoleMethod } from "../consoleMethods";
import type { ConsoleTransportEnvelope } from "../types";

/** Stable envelope type used by package transport adapters. */
export const CONSOLE_TRANSPORT_TYPE = "CONSOLE_PANEL" as const;
/** Current console transport envelope schema version. */
export const CONSOLE_TRANSPORT_VERSION = 1 as const;
/** Channel used when a transport caller does not specify one. */
export const DEFAULT_CONSOLE_CHANNEL = "default";

/**
 * Validates an unknown value as a supported console transport envelope.
 *
 * The guard verifies envelope metadata and the structural fields required by
 * clear/message events before transport consumers deserialize the payload.
 */
export function isConsoleEnvelope(
  value: unknown,
): value is ConsoleTransportEnvelope {
  if (!value || typeof value !== "object") return false;

  const envelope = value as Partial<ConsoleTransportEnvelope>;

  if (
    envelope.type !== CONSOLE_TRANSPORT_TYPE ||
    envelope.version !== CONSOLE_TRANSPORT_VERSION ||
    typeof envelope.channel !== "string" ||
    !envelope.event ||
    typeof envelope.event !== "object"
  ) {
    return false;
  }

  if (envelope.event.type === "clear") return true;
  if (envelope.event.type !== "message") return false;

  const message = envelope.event.message;

  if (!message || typeof message !== "object") return false;

  return (
    isConsoleMethod(message.method) &&
    Array.isArray(message.data) &&
    Number.isInteger(message.depth) &&
    message.depth >= 0 &&
    (message.id === undefined || typeof message.id === "string") &&
    (message.source === undefined || typeof message.source === "string") &&
    (message.timestamp === undefined ||
      (typeof message.timestamp === "number" &&
        Number.isFinite(message.timestamp))) &&
    (message.columns === undefined ||
      (Array.isArray(message.columns) &&
        message.columns.every((column) => typeof column === "string"))) &&
    (message.expandLevel === undefined ||
      (typeof message.expandLevel === "number" &&
        Number.isFinite(message.expandLevel) &&
        message.expandLevel >= 0)) &&
    (message.showNonenumerable === undefined ||
      typeof message.showNonenumerable === "boolean")
  );
}
