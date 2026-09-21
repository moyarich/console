import { useRef, useState } from "react";
import {
  Console,
  useConsoleMessages,
  type ConsoleRef,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function ConsoleEnhancementsExample() {
  const consoleRef = useRef<ConsoleRef>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [session, setSession] = useState(1);
  const [stdout, setStdout] = useState<ConsoleStdoutEntry[]>([
    {
      id: "boot",
      data: "\u001b[32mServer ready\u001b[0m on port \u001b[36m3000\u001b[0m",
    },
  ]);
  const { messages, append, clear } = useConsoleMessages({
    resetKey: session,
    clearMessage: "Console was cleared",
  });

  const addMessages = () => {
    append({
      id: `deduplicated-message-${session}`,
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

  const restartServer = () => {
    setSession((current) => current + 1);
    setStdout([
      {
        id: `restart-${Date.now()}`,
        data: "\u001b[33mServer restarted\u001b[0m",
      },
    ]);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="button-row">
        <button type="button" onClick={addMessages}>
          Add messages
        </button>

        <button
          type="button"
          onClick={() =>
            setStdout((current) => [
              ...current,
              {
                id: String(Date.now()),
                data: "\u001b[35mstdout:\u001b[0m request completed",
              },
            ])
          }
        >
          Add stdout
        </button>
      </div>

      <Console
        ref={consoleRef}
        messages={messages}
        stdout={stdout}
        consoleTabLabel="Client"
        stdoutTabLabel="Server"
        onClear={clear}
        onClearStdout={() => setStdout([])}
        onRestart={restartServer}
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
        subtitle="Filtering, ANSI stdout, restart, dedupe, reset, and smart auto-scroll"
      />
    </div>
  );
}
