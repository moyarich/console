import {
  Console,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleLogExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-log",
    passThrough: true,
  });

  const runExample = () => {
    console.log("Log message");
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
