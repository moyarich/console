import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  createConsoleEventEmitter,
  type ConsoleEventEmitter,
} from "../utils/events/createConsoleEventEmitter";
import { createConsoleProxy } from "../utils/console/runtime/createConsoleProxy";
import { captureConsole } from "../utils/console/runtime/captureConsole";
import type { ConsoleMessageData, RunOutput } from "../types";

/** Deterministic bounded-history transition shared by captured events and tests. */
export function appendConsoleRetainedMessage(
  current: { messages: ConsoleMessageData[]; droppedCount: number },
  message: ConsoleMessageData,
  maxMessages: number,
  dedupeById = true,
): { messages: ConsoleMessageData[]; droppedCount: number } {
  if (dedupeById && message.id && current.messages.some((item) => item.id === message.id)) {
    return current;
  }
  const next = [...current.messages, message];
  const limit = Number.isFinite(maxMessages) ? Math.max(0, Math.floor(maxMessages)) : next.length;
  const dropped = Math.max(0, next.length - limit);
  return {
    messages: dropped ? (limit === 0 ? [] : next.slice(-limit)) : next,
    droppedCount: current.droppedCount + dropped,
  };
}

/** Configuration for {@link useConsoleMessages}. */
export interface UseConsoleMessagesOptions {
  /** Messages used to initialize hook state. */
  initialMessages?: ConsoleMessageData[];
  /** Maximum retained message count. Oldest entries are trimmed first. */
  maxMessages?: number;
  /** Ignore incoming messages whose non-empty id is already retained. */
  dedupeById?: boolean;
  /** Changing this value clears the current message history. */
  resetKey?: unknown;
  /** Optional shared event emitter. An internal emitter is created when omitted. */
  events?: ConsoleEventEmitter;
  /** Whether to intercept calls on `consoleTarget`. */
  capture?: boolean;
  /** Source metadata attached to messages emitted by the returned console proxy. */
  source?: string;
  /** Whether captured calls should also reach the original console implementation. */
  passThrough?: boolean;
  /** Console object to intercept when `capture` is enabled. Defaults to the global console. */
  consoleTarget?: Console;
}

/**
 * Manages structured console history and exposes a console-compatible proxy.
 *
 * The returned emitter, proxy, `append`, and `clear` methods all feed the
 * same message state, making the hook suitable for embedded runtimes and
 * transport adapters.
 *
 * @returns Current messages, a `RunOutput`, a console proxy, mutation helpers,
 * the backing event emitter, and the React state setter.
 */
export function useConsoleMessages({
  initialMessages = [],
  maxMessages = 1000,
  dedupeById = true,
  resetKey,
  events: providedEvents,
  capture = false,
  source = "page",
  passThrough = true,
  consoleTarget,
}: UseConsoleMessagesOptions = {}) {
  const internalEventsRef = useRef<ConsoleEventEmitter | null>(null);
  const resetKeyRef = useRef(resetKey);
  const events =
    providedEvents ??
    (internalEventsRef.current ??= createConsoleEventEmitter());
  const [history, setHistory] = useState(() => ({
    messages: initialMessages,
    droppedCount: 0,
  }));
  const { messages, droppedCount } = history;
  const setMessages: Dispatch<SetStateAction<ConsoleMessageData[]>> =
    useCallback((updater) => {
      setHistory((current) => ({
        ...current,
        messages:
          typeof updater === "function" ? updater(current.messages) : updater,
      }));
    }, []);

  const handleMessage = useCallback(
    (message: ConsoleMessageData) => {
      setHistory((current) =>
        appendConsoleRetainedMessage(current, message, maxMessages, dedupeById),
      );
    },
    [dedupeById, maxMessages],
  );

  const handleClear = useCallback(() => {
    setHistory({ messages: [], droppedCount: 0 });
  }, []);

  const console = useMemo(
    () =>
      createConsoleProxy({
        events,
        source,
      }),
    [events, source],
  );

  useEffect(() => {
    const offMessage = events.on("message", handleMessage);
    const offClear = events.on("clear", handleClear);

    return () => {
      offMessage();
      offClear();
    };
  }, [events, handleMessage, handleClear]);

  useEffect(() => {
    if (!capture) {
      return;
    }

    return captureConsole({
      events,
      consoleTarget,
      source,
      passThrough,
    });
  }, [capture, events, consoleTarget, source, passThrough]);

  useEffect(() => {
    if (Object.is(resetKeyRef.current, resetKey)) {
      return;
    }

    resetKeyRef.current = resetKey;
    events.emit("clear");
  }, [events, resetKey]);

  const append = useCallback(
    (message: ConsoleMessageData) => {
      events.emit("message", message);
    },
    [events],
  );

  const clear = useCallback(() => {
    events.emit("clear");
  }, [events]);

  const output = useMemo<RunOutput>(
    () => ({ messages, error: "" }),
    [messages],
  );

  return {
    messages,
    droppedCount,
    retainedCount: messages.length,
    output,
    console,
    append,
    clear,
    events,
    setMessages,
  };
}
