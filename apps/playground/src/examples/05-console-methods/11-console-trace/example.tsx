import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTraceExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-trace",
    passThrough: true,
  });

  const runExample = () => {
    console.trace("Trace message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.trace(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.trace example"
      />
    </div>
  );
}
