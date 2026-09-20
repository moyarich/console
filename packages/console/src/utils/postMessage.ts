import type { ConsoleEventChannel } from "./createConsoleEventChannel";
import type { ConsoleEventSink } from "../types";
import {
  createConsoleEnvelope,
  DEFAULT_CONSOLE_CHANNEL,
  isConsoleEnvelope,
} from "./transport";

export interface PostMessageTarget {
  postMessage(message: unknown, targetOrigin: string): void;
}

export interface CreateConsolePostMessageSenderOptions {
  targetWindow: PostMessageTarget;
  targetOrigin?: string;
  channel?: string;
}

export function createConsolePostMessageSender({
  targetWindow,
  targetOrigin = "*",
  channel = DEFAULT_CONSOLE_CHANNEL,
}: CreateConsolePostMessageSenderOptions): ConsoleEventSink {
  return (event) =>
    targetWindow.postMessage(
      createConsoleEnvelope(event, channel),
      targetOrigin,
    );
}

export interface ListenForConsolePostMessagesOptions {
  events: ConsoleEventChannel;
  channel?: string;
  origin?: string | RegExp | ((origin: string) => boolean);
  source?: MessageEventSource | null;
  targetWindow?: Pick<Window, "addEventListener" | "removeEventListener">;
}

function originMatches(
  expected: ListenForConsolePostMessagesOptions["origin"],
  actual: string,
): boolean {
  if (!expected) return true;
  if (typeof expected === "string") return actual === expected;
  if (expected instanceof RegExp) return expected.test(actual);
  return expected(actual);
}

export function listenForConsolePostMessages({
  events,
  channel = DEFAULT_CONSOLE_CHANNEL,
  origin,
  source,
  targetWindow = window,
}: ListenForConsolePostMessagesOptions): () => void {
  const handler = (event: MessageEvent) => {
    if (source && event.source !== source) return;
    if (!originMatches(origin, event.origin)) return;
    if (!isConsoleEnvelope(event.data)) return;
    if (event.data.channel !== channel) return;

    events.emit(event.data.event);
  };

  targetWindow.addEventListener("message", handler as EventListener);

  return () =>
    targetWindow.removeEventListener("message", handler as EventListener);
}
