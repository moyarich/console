import { useRef, useState } from "react";
import {
  Console,
  useConsoleMessages,
  type ConsoleRef,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleEnhancementsExample() {
  const consoleRef = useRef<ConsoleRef>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [session, setSession] = useState(1);
  const { messages, append, clear } = useConsoleMessages({
    resetKey: session,
  });

  const addMessages = () => {
    append({
      id: "deduplicated-message",
      method: "log",
      data: ["This id is only added once", { session }],
      depth: 0,
    });

    append({
      method: "debug",
      data: ["Debug details", new Map([["session", session]])],
      depth: 0,
    });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="button-row">
        <button type="button" onClick={addMessages}>
          Add messages
        </button>

        <button
          type="button"
          onClick={() => setSession((current) => current + 1)}
        >
          Start new session
        </button>
      </div>

      <Console
        ref={consoleRef}
        messages={messages}
        onClear={clear}
        filter={(message) => showDebug || message.method !== "debug"}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowDebug((current) => !current)}
            >
              {showDebug ? "Hide debug" : "Show debug"}
            </button>
            <button type="button" onClick={() => consoleRef.current?.reset()}>
              Reset
            </button>
          </>
        }
        subtitle="Filtering, actions, dedupe, reset, and smart auto-scroll"
      />
    </div>
  );
}
