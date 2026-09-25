import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleTableExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-table",
  });

  const runExample = () => {
    console.table([
      { name: "Ada", role: "Admin", active: true },
      { name: "Grace", role: "Editor", active: false },
    ]);
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
