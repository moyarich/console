import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleDirExample() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "console-dir",
      passThrough: true,
    });
  }, [events]);

  const runExample = () => {
    console.dir("Directory message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.dir(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.dir example"
      />
    </div>
  );
}
