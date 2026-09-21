import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTimeEndExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-time-end",
    passThrough: true,
  });

  const runExample = () => {
    console.time("Timer message");

    setTimeout(() => {
      console.timeEnd("Timer message");
    }, 500);
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
