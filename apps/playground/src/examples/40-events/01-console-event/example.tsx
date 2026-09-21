import { useState } from "react";
import {
  Console,
  createConsoleEventEmitter,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleEventExample() {
  const [events] = useState(createConsoleEventEmitter);
  const { messages } = useConsoleMessages({ events });

  const emitMessage = () => {
    events.emit("message", {
      method: "log",
      data: ["Hello from ConsoleEventEmitter", { transportReady: true }],
      depth: 0,
      timestamp: Date.now(),
      source: "console-event-example",
    });
  };

  const emitClear = () => {
    events.emit("clear");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={emitMessage}>
          Emit message
        </button>

        <button type="button" onClick={emitClear}>
          Emit clear
        </button>
      </div>

      <Console
        messages={messages}
        onClear={emitClear}
        subtitle="Named ConsoleEventEmitter events"
      />
    </div>
  );
}
