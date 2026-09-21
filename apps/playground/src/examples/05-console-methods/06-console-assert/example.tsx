import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleAssertExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-assert",
  });

  const runExample = () => {
    console.assert(true, "This assertion is not emitted");
    console.assert(false, "Assertion message", { expected: true });
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
