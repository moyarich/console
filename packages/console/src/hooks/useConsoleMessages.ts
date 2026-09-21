import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createConsoleEventEmitter,
  type ConsoleEventEmitter,
} from "../utils/createConsoleEventEmitter";
import { capturePageConsole } from "../utils/capturePageConsole";
import type { ConsoleMessageData, RunOutput } from "../types";

export interface UseConsoleMessagesOptions {
  initialMessages?: ConsoleMessageData[];
  maxMessages?: number;
  events?: ConsoleEventEmitter;
  capture?: boolean;
  source?: string;
  passThrough?: boolean;
  target?: Console;
}

export function useConsoleMessages({
  initialMessages = [],
  maxMessages = 1000,
  events: providedEvents,
  capture = false,
  source = "page",
  passThrough = true,
  target,
}: UseConsoleMessagesOptions = {}) {
  const internalEventsRef = useRef<ConsoleEventEmitter | null>(null);
  const events =
    providedEvents ??
    (internalEventsRef.current ??= createConsoleEventEmitter());
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const handleMessage = useCallback(
    (message: ConsoleMessageData) => {
      setMessages((current) => {
        const next = [...current, message];

        return next.length > maxMessages ? next.slice(-maxMessages) : next;
      });
    },
    [maxMessages],
  );

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

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

    return capturePageConsole({
      events,
      target,
      source,
      passThrough,
    });
  }, [capture, events, target, source, passThrough]);

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
    append,
    clear,
    events,
    setMessages,
  };
}
