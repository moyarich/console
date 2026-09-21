import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleLogExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-log",
  });

  const runExample = () => {
    console.log("Log message", { ready: true });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.log(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.log example"
      />
    </div>
  );
}
