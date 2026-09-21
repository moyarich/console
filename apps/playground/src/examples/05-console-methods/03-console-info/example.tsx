import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleInfoExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-info",
  });

  const runExample = () => {
    console.info("Info message", { version: "1.0.0" });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.info(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.info example"
      />
    </div>
  );
}
