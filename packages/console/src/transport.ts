import { serializeConsoleEvent } from "./serialization";
import type { ConsoleEvent, ConsoleTransportEnvelope } from "./types";

export const CONSOLE_TRANSPORT_TYPE = "@moyarich/console" as const;
export const CONSOLE_TRANSPORT_VERSION = 1 as const;
export const DEFAULT_CONSOLE_CHANNEL = "default";

export function createConsoleEnvelope(event: ConsoleEvent, channel = DEFAULT_CONSOLE_CHANNEL): ConsoleTransportEnvelope {
  return { type: CONSOLE_TRANSPORT_TYPE, version: CONSOLE_TRANSPORT_VERSION, channel, event: serializeConsoleEvent(event) };
}

export function isConsoleEnvelope(value: unknown): value is ConsoleTransportEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<ConsoleTransportEnvelope>;
  return envelope.type === CONSOLE_TRANSPORT_TYPE && envelope.version === CONSOLE_TRANSPORT_VERSION && typeof envelope.channel === "string" && !!envelope.event && typeof envelope.event === "object" && (envelope.event.type === "message" || envelope.event.type === "clear");
}
