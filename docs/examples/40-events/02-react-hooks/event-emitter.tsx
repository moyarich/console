import { useEffect, useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createEventRuntime } from "./event-runtime";
import "@moyarich/console/styles.css";

const MAX_MESSAGES = 100;

export default function EventEmitterExample() {
  const [runtime] = useState(createEventRuntime);
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);

  useEffect(() => {
    const offMessage = runtime.events.on("message", (message) => {
      setMessages((current) => {
        const next = [...current, message];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    });

    const offClear = runtime.events.on("clear", () => setMessages([]));

    return () => {
      offMessage();
      offClear();
    };
  }, [runtime]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            runtime.console.info("Cache hit", { key: "users:list" })
          }
        >
          Emit message
        </button>
        <button type="button" onClick={runtime.console.clear}>
          Clear
        </button>
      </div>

      <Console
        messages={messages}
        onClear={runtime.console.clear}
        title="Host-owned React state"
      />
    </div>
  );
}
