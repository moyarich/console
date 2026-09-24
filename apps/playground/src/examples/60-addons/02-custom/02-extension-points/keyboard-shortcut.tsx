import { useMemo, useState } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  { id: "ready", method: "log", data: ["Focus this panel, then press Ctrl+K."], depth: 0 },
];

export default function KeyboardShortcutExample() {
  const [count, setCount] = useState(0);
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.keyboard-shortcut",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.keyboardShortcut,
            {
              id: "increment-counter",
              key: "k",
              ctrlKey: true,
              onTrigger: () => setCount((current) => current + 1),
            },
            { id: "increment-counter" },
          );
        },
      },
    ],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Console
        messages={messages}
        addons={addons}
        title="keyboardShortcut"
        subtitle="Shortcut handling stays scoped to the focused Console."
      />
      <div role="status">
        Shortcut triggered: <strong>{count}</strong>
      </div>
    </div>
  );
}
