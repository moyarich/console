import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function CurrentPageConsole() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "current-page",
    passThrough: true,
  });

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
