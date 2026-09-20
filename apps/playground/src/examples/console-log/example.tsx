import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleLogExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-log",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.log("Log message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.log(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.log example"
      />
    </div>
  );
}
