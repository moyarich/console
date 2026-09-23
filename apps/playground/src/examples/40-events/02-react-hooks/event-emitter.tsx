import { useEffect, useMemo, useState } from "react";
import {
  Console,
  createConsoleEventEmitter,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const MAX_MESSAGES = 100;

export default function EventEmitterExample() {
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);
  const [events] = useState(createConsoleEventEmitter);

  const console = useMemo(
    () =>
      createConsoleProxy({
        events,
        source: "host-owned-state",
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

    const offClear = events.on("clear", () => setMessages([]));

    return () => {
      offMessage();
      offClear();
    };
  }, [events]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => console.info("Cache hit", { key: "users:list" })}
        >
          Emit message
        </button>
        <button type="button" onClick={console.clear}>
          Clear
        </button>
      </div>

      <Console
        messages={messages}
        onClear={console.clear}
        title="Host-owned React state"
      />
    </div>
  );
}
