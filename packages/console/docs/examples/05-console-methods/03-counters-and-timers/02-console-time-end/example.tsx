import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTimeEndExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-time-end",
  });

  const runExample = () => {
    console.time("compile");
    console.timeEnd("compile");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.timeEnd(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.timeEnd example"
      />
    </div>
  );
}
