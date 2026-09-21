import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleInfoExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-info",
    passThrough: true,
  });

  const runExample = () => {
    console.info("Info message");
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
