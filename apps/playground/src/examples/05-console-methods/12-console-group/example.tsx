import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleGroupExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-group",
  });

  const runExample = () => {
    console.group("Build");
    console.log("Compiling application");
    console.log("Writing output", { files: 42 });
    console.groupEnd();
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.group(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.group example"
      />
    </div>
  );
}
