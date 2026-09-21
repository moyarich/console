import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";
import { createConsoleEventHandler } from "./createConsoleEventHandler";
import { deserializeConsoleEvent } from "./serialization";
import { DEFAULT_CONSOLE_CHANNEL, isConsoleEnvelope } from "./transport";

/** Minimal WebSocket-compatible surface required by the console listener. */
export interface ConsoleWebSocketLike {
  send(data: string): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent) => void,
  ): void;
}

/** Options for receiving serialized console envelopes from a WebSocket. */
export interface ListenForConsoleWebSocketOptions {
  socket: ConsoleWebSocketLike;
  events: ConsoleEventEmitter;
  channel?: string;
}

/**
 * Listens for JSON-encoded console envelopes on a WebSocket-like object.
 *
 * Invalid JSON, unrelated channels, and invalid envelopes are ignored without
 * tearing down the listener.
 *
 * @returns A cleanup function that removes the message listener.
 */
export function listenForConsoleWebSocket({
  socket,
  events,
  channel = DEFAULT_CONSOLE_CHANNEL,
}: ListenForConsoleWebSocketOptions): () => void {
  const handleConsoleEvent = createConsoleEventHandler(events);

  const handler = (event: MessageEvent) => {
    if (typeof event.data !== "string") {
      return;
    }

    try {
      const data = JSON.parse(event.data) as unknown;

      if (!isConsoleEnvelope(data) || data.channel !== channel) {
        return;
      }

      handleConsoleEvent(deserializeConsoleEvent(data.event));
    } catch {
      // Keep the listener active if parsing or event delivery fails.
    }
  };

  socket.addEventListener("message", handler);

  return () => socket.removeEventListener("message", handler);
}
