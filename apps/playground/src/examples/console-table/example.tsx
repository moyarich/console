import {
  Console,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTableExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-table",
    passThrough: true,
  });

  const runExample = () => {
    console.table([{ message: "Table message" }]);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.table(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.table example"
      />
    </div>
  );
}
