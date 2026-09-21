import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleCountExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-count",
    passThrough: true,
  });

  const runExample = () => {
    console.count("Count message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.count(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.count example"
      />
    </div>
  );
}
