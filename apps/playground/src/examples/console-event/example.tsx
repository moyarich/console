import { useState } from "react";
import {
  Console,
  createConsoleEventEmitter,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleEventExample() {
  const [events] = useState(createConsoleEventEmitter);
  const { messages } = useConsoleMessages({ events });

  const emitMessageEvent = () => {
    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: [
          "Hello from ConsoleEvent",
          { transportReady: true },
        ],
        depth: 0,
        timestamp: Date.now(),
        source: "console-event-example",
      },
    };

    events.emitEvent(event);
  };

  const emitClearEvent = () => {
    const event: ConsoleEvent = {
      type: "clear",
    };

    events.emitEvent(event);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={emitMessageEvent}>
          Emit message event
        </button>

        <button type="button" onClick={emitClearEvent}>
          Emit clear event
        </button>
      </div>

      <Console
        messages={messages}
        onClear={emitClearEvent}
        subtitle="ConsoleEvent transport/data union"
      />
    </div>
  );
}
