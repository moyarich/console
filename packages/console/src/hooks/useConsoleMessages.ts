import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createConsoleEventEmitter,
  type ConsoleEventEmitter,
} from "../utils/createConsoleEventEmitter";
import type { ConsoleMessageData, RunOutput } from "../types";

export interface UseConsoleMessagesOptions {
  initialMessages?: ConsoleMessageData[];
  maxMessages?: number;
  events?: ConsoleEventEmitter;
}

export function useConsoleMessages({
  initialMessages = [],
  maxMessages = 1000,
  events: providedEvents,
}: UseConsoleMessagesOptions = {}) {
  const internalEventsRef = useRef<ConsoleEventEmitter | null>(null);

  if (!internalEventsRef.current) {
    internalEventsRef.current = createConsoleEventEmitter();
  }

  const events = providedEvents ?? internalEventsRef.current;
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const handleMessage = useCallback(
    (message: ConsoleMessageData) => {
      setMessages((current) => {
        const next = [...current, message];

        return next.length > maxMessages
          ? next.slice(-maxMessages)
          : next;
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
