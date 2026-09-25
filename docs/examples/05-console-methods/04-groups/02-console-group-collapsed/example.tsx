import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleGroupCollapsedExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-group-collapsed",
  });

  const runExample = () => {
    console.groupCollapsed("Request details");
    console.log("GET /api/users");
    console.log({ status: 200, cached: true });
    console.groupEnd();
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.groupCollapsed(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.groupCollapsed example"
      />
    </div>
  );
}
