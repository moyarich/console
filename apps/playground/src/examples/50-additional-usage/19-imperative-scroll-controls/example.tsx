import { useMemo, useRef, useState } from "react";
import {
  Console,
  type ConsoleHandle,
  type ConsoleMessageData,
} from "@moyarich/console";
import { createImperativeScrollingAddon } from "@moyarich/console-addon-imperative-scrolling";
import "@moyarich/console/styles.css";

const TARGET_ID = "message-24";

const initialMessages: ConsoleMessageData[] = Array.from(
  { length: 40 },
  (_, index) => ({
    id: `message-${index + 1}`,
    method: index === 23 ? "warn" : "log",
    depth: 0,
    data: [
      `Message ${index + 1}`,
      index === 23 ? { status: "needs attention" } : { status: "ok" },
    ],
  }),
);

function getPositionLabel(handle: ConsoleHandle | null) {
  if (!handle) return "Console not mounted";
  if (handle.isAtTop()) return "At top";
  if (handle.isAtBottom()) return "At bottom";
  return "Between top and bottom";
}

export default function ImperativeScrollControlsExample() {
  const consoleRef = useRef<ConsoleHandle>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [position, setPosition] = useState("Use a navigation control");

  const addons = useMemo(() => [createImperativeScrollingAddon()], []);

  const run = (action: (handle: ConsoleHandle) => void) => {
    const handle = consoleRef.current;
    if (!handle) return;

    action(handle);
    setPosition(getPositionLabel(handle));
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => run((handle) => handle.scrollToTop())}
        >
          Top
        </button>
        <button
          type="button"
          onClick={() =>
            run((handle) =>
              handle.scrollToMessage(TARGET_ID, { block: "center" }),
            )
          }
        >
          Jump to message 24
        </button>
        <button
          type="button"
          onClick={() => run((handle) => handle.scrollToBottom())}
        >
          Latest output
        </button>
        <button type="button" onClick={() => run((handle) => handle.focus())}>
          Focus console
        </button>
        <button
          type="button"
          onClick={() =>
            setMessages((current) => [
              ...current,
              {
                id: `message-${current.length + 1}`,
                method: "log",
                depth: 0,
                data: [`Appended message ${current.length + 1}`],
              },
            ])
          }
        >
          Append output
        </button>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 13 }}>
        Position: <strong>{position}</strong>. The console action menu contains
        top, latest-output, and focus actions from the imperative-scrolling
        workspace addon.
      </p>

      <Console
        ref={consoleRef}
        messages={messages}
        addons={addons}
        title="Imperative navigation"
        subtitle="ConsoleHandle and the imperative-scrolling addon share the core viewport service."
        style={{ height: 320 }}
      />
    </div>
  );
}
