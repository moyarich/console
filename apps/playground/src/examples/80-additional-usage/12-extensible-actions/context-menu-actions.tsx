import { useState } from "react";
import {
  Console,
  type ConsoleContextMenuAction,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "log",
    data: ["Request complete", { status: 200, durationMs: 84 }],
    depth: 0,
  },
  {
    id: "warning",
    method: "warn",
    data: ["Cache nearing capacity", { usage: "86%" }],
    depth: 0,
  },
];

export default function ContextMenuActionsExample() {
  const [lastAction, setLastAction] = useState(
    "Right-click the console, an object, or a message.",
  );

  const contextMenuActions: ConsoleContextMenuAction[] = [
    {
      id: "inspect-context",
      label: "Inspect target",
      onSelect: (context) => {
        if (context.kind === "message") {
          setLastAction(
            `Message #${context.index + 1}: ${context.message.method}`,
          );
          return;
        }

        if (context.kind === "object") {
          setLastAction(
            `Object with ${Object.keys(context.value).length} enumerable keys`,
          );
          return;
        }

        setLastAction(
          `Console with ${context.hasMessages ? "output" : "no output"}`,
        );
      },
    },
    {
      id: "report-count",
      label: "Report message count",
      visible: (context) => context.kind === "console",
      disabled: ({ hasMessages }) => !hasMessages,
      onSelect: () => setLastAction(`${messages.length} messages are visible.`),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div role="status">
        <strong>Last action:</strong> {lastAction}
      </div>
      <Console
        messages={messages}
        contextMenuActions={contextMenuActions}
        title="Context menu actions"
      />
    </div>
  );
}
