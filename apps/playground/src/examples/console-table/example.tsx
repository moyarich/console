import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTableExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-table",
      passThrough: true,
    });
  }, [onEvent]);

  const runExample = () => {
    console.table([{ message: "Table message" }]);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.table(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.table example"
      />
    </div>
  );
}
