import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";
import { createConsoleEventHandler } from "./createConsoleEventHandler";
import { deserializeConsoleEvent } from "./serialization";
import { DEFAULT_CONSOLE_CHANNEL, isConsoleEnvelope } from "./transport";

/** Options for receiving versioned console envelopes through `postMessage`. */
export interface ListenForConsolePostMessagesOptions {
  events: ConsoleEventEmitter;
  channel?: string;
  origin?: string | RegExp | ((origin: string) => boolean);
  source?: MessageEventSource | null;
  targetWindow?: Pick<Window, "addEventListener" | "removeEventListener">;
}

/** Evaluates the configured origin allow-list against a MessageEvent origin. */
function originMatches(
  expected: ListenForConsolePostMessagesOptions["origin"],
  actual: string,
): boolean {
  if (!expected) return true;
  if (typeof expected === "string") return actual === expected;
  if (expected instanceof RegExp) return expected.test(actual);
  return expected(actual);
}

/**
 * Listens for console transport envelopes delivered through `window.postMessage`.
 *
 * Source, origin, channel, envelope shape, and serialized event data are
 * validated before forwarding events to the supplied emitter.
 *
 * @returns A cleanup function that removes the message listener.
 */
export function listenForConsolePostMessages({
  events,
  channel = DEFAULT_CONSOLE_CHANNEL,
  origin,
  source,
  targetWindow = window,
}: ListenForConsolePostMessagesOptions): () => void {
  const handleConsoleEvent = createConsoleEventHandler(events);

  const handler = (event: MessageEvent) => {
    if (source && event.source !== source) return;
    if (!originMatches(origin, event.origin)) return;
    if (!isConsoleEnvelope(event.data)) return;
    if (event.data.channel !== channel) return;

    handleConsoleEvent(deserializeConsoleEvent(event.data.event));
  };

  targetWindow.addEventListener("message", handler as EventListener);

  return () =>
    targetWindow.removeEventListener("message", handler as EventListener);
}
