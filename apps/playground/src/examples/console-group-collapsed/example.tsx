import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleGroupCollapsedExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-group-collapsed",
      passThrough: true,
    });
  }, [onEvent]);

  const runExample = () => {
    console.groupCollapsed("Collapsed group message");
    console.groupEnd();
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.groupCollapsed(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.groupCollapsed example"
      />
    </div>
  );
}
