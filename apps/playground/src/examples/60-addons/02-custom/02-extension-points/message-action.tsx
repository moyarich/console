import { useMemo, useState } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "error",
    data: ["Request failed", { status: 503 }],
    depth: 0,
  },
];

export default function MessageActionExample() {
  const [selectedMessage, setSelectedMessage] = useState("none");

  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.message-action",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.messageAction,
            {
              id: "inspect-message",
              label: "Inspect message",
              onSelect: ({ message }) =>
                setSelectedMessage(message.id ?? "message"),
            },
            { id: "inspect-message" },
          );
        },
      },
    ],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Console messages={messages} addons={addons} title="messageAction" />
      <div role="status">
        Last selected message: <strong>{selectedMessage}</strong>
      </div>
    </div>
  );
}
