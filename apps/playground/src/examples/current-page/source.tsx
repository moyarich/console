import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import { useEffect } from "react";

export default function CurrentPageExample() {
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });

  useEffect(
    () =>
      capturePageConsole({
        onEvent,
        source: "current-page",
      }),
    [onEvent],
  );

  return (
    <section className="workspace">
      <aside className="controls-card">
        <h2>Current page</h2>
        <p>
          <code>capturePageConsole()</code> patches this page&apos;s console and
          forwards each event to the React store.
        </p>

        <div className="button-stack">
          <button
            onClick={() =>
              console.log("hello", {
                package: "@moyarich/console",
                ok: true,
              })
            }
          >
            console.log
          </button>
          <button onClick={() => console.warn("warning from the current page")}>
            console.warn
          </button>
          <button onClick={() => console.error("error from the current page")}>
            console.error
          </button>
          <button
            onClick={() =>
              console.table([
                { name: "margin", value: "10px" },
                { name: "padding", value: "8px" },
              ])
            }
          >
            console.table
          </button>
          <button
            onClick={() => {
              console.group("group");
              console.log("nested message");
              console.groupEnd();
            }}
          >
            console.group
          </button>
        </div>
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Captured from this page"
      />
    </section>
  );
}
