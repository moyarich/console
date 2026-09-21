import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleErrorExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-error",
  });

  const runExample = () => {
    console.error("Error message", new Error("Example failure"));
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.error(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.error example"
      />
    </div>
  );
}
