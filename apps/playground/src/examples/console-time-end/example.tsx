import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTimeEndExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-time-end",
      passThrough: true,
    });
  }, [onEvent]);

  const runExample = () => {
    console.time("Timer message");
    console.timeEnd("Timer message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.timeEnd(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.timeEnd example"
      />
    </div>
  );
}
