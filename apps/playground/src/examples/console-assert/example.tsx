import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleAssertExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-assert",
      passThrough: true,
    });
  }, [onEvent]);

  const runExample = () => {
    console.assert(false, "Assertion message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.assert(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.assert example"
      />
    </div>
  );
}
