import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleErrorExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-error",
      passThrough: true,
    });
  }, [onEvent]);

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
