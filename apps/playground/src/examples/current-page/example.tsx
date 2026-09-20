import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function CurrentPageConsole() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "current-page",
      passThrough: true,
    });
  }, [events]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button
        type="button"
        onClick={() =>
          console.log("Hello from the current page", {
            package: "@moyarich/console",
          })
        }
      >
        Write to console
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Captured from this page"
      />
    </div>
  );
}
