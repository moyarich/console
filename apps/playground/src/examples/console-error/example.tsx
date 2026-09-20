import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleErrorExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-error",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.error("Error message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.error(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.error example"
      />
    </div>
  );
}
