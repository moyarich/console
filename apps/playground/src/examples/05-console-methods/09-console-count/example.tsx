import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleCountExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-count",
  });

  const runExample = () => {
    console.count("requests");
    console.count("requests");
    console.count("requests");
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
