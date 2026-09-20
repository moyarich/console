import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleWarnExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-warn",
      passThrough: true,
    });
  }, [onEvent]);

  const runExample = () => {
    console.warn("Warning message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.warn(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.warn example"
      />
    </div>
  );
}
