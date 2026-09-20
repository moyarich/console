import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleDebugExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-debug",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.debug("Debug message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.debug(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.debug example"
      />
    </div>
  );
}
