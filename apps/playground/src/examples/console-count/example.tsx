import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleCountExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-count",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.count("Count message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.count(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.count example"
      />
    </div>
  );
}
