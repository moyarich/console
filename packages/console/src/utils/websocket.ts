import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";
import type { ConsoleEventSink } from "../types";
import {
  createConsoleEnvelope,
  DEFAULT_CONSOLE_CHANNEL,
  isConsoleEnvelope,
} from "./transport";

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

export interface CreateConsoleWebSocketSenderOptions {
  socket: Pick<ConsoleWebSocketLike, "send">;
  channel?: string;
}

export function createConsoleWebSocketSender({
  socket,
  channel = DEFAULT_CONSOLE_CHANNEL,
}: CreateConsoleWebSocketSenderOptions): ConsoleEventSink {
  return (event) =>
    socket.send(
      JSON.stringify(createConsoleEnvelope(event, channel)),
    );
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

      events.emitEvent(data.event);
    } catch {}
  };

  socket.addEventListener("message", handler);

  return () => socket.removeEventListener("message", handler);
}
