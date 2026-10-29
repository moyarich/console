import { useEffect, useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createEventRuntime } from "./event-runtime";
import "@moyarich/console/styles.css";

const MAX_MESSAGES = 100;

export default function EventEmitterExample() {
  const [runtime] = useState(createEventRuntime);
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);

  useEffect(() => {
    const onMessage = (message: ConsoleMessageData) => {
      setMessages((current) => {
        const next = [...current, message];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    };
    const onClear = () => setMessages([]);
    runtime.events.on("message", onMessage);
    runtime.events.on("clear", onClear);

    return () => {
      runtime.events.off("message", onMessage);
      runtime.events.off("clear", onClear);
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
