import { useEffect, useMemo, useState } from "react";
import {
  Console,
  createConsoleEventEmitter,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const MAX_MESSAGES = 1000;

export default function ConsoleExample() {
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);

  const [events] = useState(createConsoleEventEmitter);

  const console = useMemo(
    () =>
      createConsoleProxy({
        events,
        source: "without-console-hook",
      }),
    [events],
  );

  useEffect(() => {
    const offMessage = events.on("message", (message) => {
      setMessages((current) => {
        const next = [...current, message];

        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    });

    const offClear = events.on("clear", () => {
      setMessages([]);
    });

    return () => {
      offMessage();
      offClear();
    };
  }, [events]);

  const runExample = () => {
    console.log("Request complete", { status: 200, durationMs: 84 });
    console.info("Cache hit", { key: "users:list" });
    console.warn("Retry budget low", { remaining: 2 });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={runExample}>
          Run example
        </button>

        <button type="button" onClick={console.clear}>
          Clear
        </button>
      </div>

      <Console messages={messages} onClear={console.clear} />
    </div>
  );
}
