import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleAssertExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-assert",
    passThrough: true,
  });

  const runExample = () => {
    console.assert(false, "Assertion message");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.assert(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.assert example"
      />
    </div>
  );
}
