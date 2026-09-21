import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createConsoleEventEmitter,
  type ConsoleEventEmitter,
} from "../utils/createConsoleEventEmitter";
import { createConsoleProxy } from "../utils/createConsoleProxy";
import { captureConsole } from "../utils/captureConsole";
import type { ConsoleMessageData, RunOutput } from "../types";

export interface UseConsoleMessagesOptions {
  initialMessages?: ConsoleMessageData[];
  maxMessages?: number;
  dedupeById?: boolean;
  resetKey?: unknown;
  events?: ConsoleEventEmitter;
  capture?: boolean;
  source?: string;
  passThrough?: boolean;
  consoleTarget?: Console;
}

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
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const handleMessage = useCallback(
    (message: ConsoleMessageData) => {
      setMessages((current) => {
        if (
          dedupeById &&
          message.id &&
          current.some((item) => item.id === message.id)
        ) {
          return current;
        }

        const next = [...current, message];

        return next.length > maxMessages ? next.slice(-maxMessages) : next;
      });
    },
    [dedupeById, maxMessages],
  );

  const handleClear = useCallback(() => {
    setMessages([]);
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
    output,
    console,
    append,
    clear,
    events,
    setMessages,
  };
}
