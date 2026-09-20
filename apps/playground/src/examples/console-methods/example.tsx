import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const METHOD_EXAMPLES = [
  {
    label: "log",
    run: () => console.log("Log message"),
  },
  {
    label: "debug",
    run: () => console.debug("Debug message"),
  },
  {
    label: "info",
    run: () => console.info("Info message"),
  },
  {
    label: "warn",
    run: () => console.warn("Warning message"),
  },
  {
    label: "error",
    run: () => console.error("Error message"),
  },
  {
    label: "assert",
    run: () => console.assert(false, "Assertion message"),
  },
  {
    label: "dir",
    run: () => console.dir("Directory message"),
  },
  {
    label: "table",
    run: () => console.table([{ message: "Table message" }]),
  },
  {
    label: "count",
    run: () => console.count("Count message"),
  },
  {
    label: "timeEnd",
    run: () => {
      console.time("Timer message");
      console.timeEnd("Timer message");
    },
  },
  {
    label: "trace",
    run: () => console.trace("Trace message"),
  },
  {
    label: "group",
    run: () => {
      console.group("Group message");
      console.log("Message inside group");
      console.groupEnd();
    },
  },
  {
    label: "groupCollapsed",
    run: () => {
      console.groupCollapsed("Collapsed group message");
      console.log("Message inside collapsed group");
      console.groupEnd();
    },
  },
] as const;

export default function ConsoleMethodsExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "console-methods",
      passThrough: true,
    });
  }, [onEvent]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {METHOD_EXAMPLES.map(({ label, run }) => (
          <button key={label} type="button" onClick={run}>
            console.{label}()
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => METHOD_EXAMPLES.forEach(({ run }) => run())}
      >
        Run all methods
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Examples for each supported console method"
      />
    </div>
  );
}
