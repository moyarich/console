import { useCallback, useMemo, useState } from "react";
import type { ConsoleEvent, ConsoleMessageData, RunOutput } from "./types";

export interface UseConsoleMessagesOptions {
  initialMessages?: ConsoleMessageData[];
  maxMessages?: number;
}

export function useConsoleMessages({ initialMessages = [], maxMessages = 1000 }: UseConsoleMessagesOptions = {}) {
  const [messages, setMessages] = useState<ConsoleMessageData[]>(initialMessages);
  const clear = useCallback(() => setMessages([]), []);
  const append = useCallback((message: ConsoleMessageData) => {
    setMessages((current) => {
      const next = [...current, message];
      return next.length > maxMessages ? next.slice(-maxMessages) : next;
    });
  }, [maxMessages]);
  const onEvent = useCallback((event: ConsoleEvent) => {
    if (event.type === "clear") { clear(); return; }
    append(event.message);
  }, [append, clear]);
  const output = useMemo<RunOutput>(() => ({ messages, error: "" }), [messages]);
  return { messages, output, append, clear, onEvent, setMessages };
}
