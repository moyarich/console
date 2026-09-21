import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";
import { deserializeConsoleEvent } from "./serialization";
import { DEFAULT_CONSOLE_CHANNEL, isConsoleEnvelope } from "./transport";

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

export interface ListenForConsoleWebSocketOptions {
  socket: ConsoleWebSocketLike;
  events: ConsoleEventEmitter;
  channel?: string;
}

export function listenForConsoleWebSocket({
  socket,
  events,
  channel = DEFAULT_CONSOLE_CHANNEL,
}: ListenForConsoleWebSocketOptions): () => void {
  const handler = (event: MessageEvent) => {
    if (typeof event.data !== "string") {
      return;
    }

    try {
      const data = JSON.parse(event.data) as unknown;

      if (!isConsoleEnvelope(data) || data.channel !== channel) {
        return;
      }

      events.dispatch(deserializeConsoleEvent(data.event));
    } catch {
      // Keep the listener active if parsing or event delivery fails.
    }
  };

  socket.addEventListener("message", handler);

  return () => socket.removeEventListener("message", handler);
}
