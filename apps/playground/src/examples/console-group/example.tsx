import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleGroupExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-group",
      passThrough: true,
    });
  }, [onEvent]);

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
