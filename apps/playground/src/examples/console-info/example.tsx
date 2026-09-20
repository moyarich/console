import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleInfoExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-info",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.info("Info message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.info(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.info example"
      />
    </div>
  );
}
