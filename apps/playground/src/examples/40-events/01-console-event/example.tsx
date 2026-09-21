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
        data: ["Hello from ConsoleEvent", { transportReady: true }],
        depth: 0,
        timestamp: Date.now(),
        source: "console-event-example",
      },
    };

    events.dispatch(event);
  };

  const emitClearEvent = () => {
    const event: ConsoleEvent = {
      type: "clear",
    };

    events.dispatch(event);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={emitMessageEvent}>
          Dispatch message event
        </button>

        <button type="button" onClick={emitClearEvent}>
          Dispatch clear event
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
