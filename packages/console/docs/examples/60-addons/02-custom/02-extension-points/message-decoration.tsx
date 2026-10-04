import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  { id: "ready", method: "log", data: ["Application ready"], depth: 0 },
  { id: "failed", method: "error", data: ["Request failed"], depth: 0 },
];

export default function MessageDecorationExample() {
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.message-decoration",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.messageDecoration,
            {
              id: "error-badge",
              placement: "badge",
              match: ({ message }) => message.method === "error",
              render: () => (
                <span
                  style={{
                    border: "1px solid currentColor",
                    borderRadius: 999,
                    padding: "2px 6px",
                    fontSize: 11,
                  }}
                >
                  Needs attention
                </span>
              ),
            },
            { id: "error-badge" },
          );
        },
      },
    ],
    [],
  );

  return (
    <Console
      messages={messages}
      addons={addons}
      title="messageDecoration"
      subtitle="Add UI around a row without replacing its renderer."
    />
  );
}
