import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleGroupExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-group",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.group("Group message");
    console.groupEnd();
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.group(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.group example"
      />
    </div>
  );
}
