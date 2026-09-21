import { useState } from "react";
import {
  Console,
  createConsoleEventEmitter,
  createConsoleEventHandler,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleEventExample() {
  const [events] = useState(createConsoleEventEmitter);
  const { messages } = useConsoleMessages({ events });
  const handleConsoleEvent = createConsoleEventHandler(events);

  const emitMessageEvent = () => {
    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["Hello from ConsoleEvent", { transportReady: true }],
        depth: 0,
        timestamp: Date.now(),
        source: "console-event-example",
      },
    };

    handleConsoleEvent(event);
  };

  const emitClearEvent = () => {
    const event: ConsoleEvent = {
      type: "clear",
    };

    handleConsoleEvent(event);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={emitMessageEvent}>
          Handle message event
        </button>

        <button type="button" onClick={emitClearEvent}>
          Handle clear event
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
