import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleDirExample() {
  const { messages, console, clear } = useConsoleMessages({
    source: "console-dir",
  });

  const runExample = () => {
    console.dir(
      {
        name: "Directory message",
        details: {
          nested: true,
          values: [1, 2, 3],
        },
      },
      {
        depth: 2,
        showHidden: false,
      },
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={runExample}>
        console.dir(...)
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.dir example"
      />
    </div>
  );
}
