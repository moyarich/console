import {
  Console,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleDirExample() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "console-dir",
    passThrough: true,
  });

  const runExample = () => {
    console.dir("Directory message");
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
