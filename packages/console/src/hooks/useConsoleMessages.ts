import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createConsoleEventChannel,
  type ConsoleEventChannel,
} from "../utils/createConsoleEventChannel";
import type { ConsoleEvent, ConsoleMessageData, RunOutput } from "../types";

export interface UseConsoleMessagesOptions {
  initialMessages?: ConsoleMessageData[];
  maxMessages?: number;
  events?: ConsoleEventChannel;
}

export function useConsoleMessages({
  initialMessages = [],
  maxMessages = 1000,
  events: providedEvents,
}: UseConsoleMessagesOptions = {}) {
  const internalEventsRef = useRef<ConsoleEventChannel | null>(null);

  if (!internalEventsRef.current) {
    internalEventsRef.current = createConsoleEventChannel();
  }

  const events = providedEvents ?? internalEventsRef.current;
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);

  const clear = useCallback(() => setMessages([]), []);

  const append = useCallback(
    (message: ConsoleMessageData) => {
      setMessages((current) => {
        const next = [...current, message];
        return next.length > maxMessages ? next.slice(-maxMessages) : next;
      });
    },
    [maxMessages],
  );

  const handleEvent = useCallback(
    (event: ConsoleEvent) => {
      if (event.type === "clear") {
        clear();
        return;
      }

      append(event.message);
    },
    [append, clear],
  );

  useEffect(() => events.subscribe(handleEvent), [events, handleEvent]);

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
