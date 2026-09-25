import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function UseConsoleMessagesExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "react-hook",
    maxMessages: 100,
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => console.log("Request complete", { status: 200 })}
        >
          Log message
        </button>
        <button type="button" onClick={clear}>
          Clear
        </button>
      </div>

      <Console messages={messages} onClear={clear} title="useConsoleMessages" />
    </div>
  );
}
