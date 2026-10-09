import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "build",
    method: "info",
    source: "build",
    data: ["Build complete"],
    depth: 0,
  },
  {
    id: "request",
    method: "info",
    source: "network",
    data: ["Request complete"],
    depth: 0,
  },
];

function createMessageRendererAddon(): ConsoleAddon {
  return {
    id: "example.message-renderer",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.messageRenderer,
        {
          method: "info",
          match: ({ message }) => message.source === "build",
          render: ({ message }) => (
            <div
              style={{ borderLeft: "3px solid currentColor", paddingLeft: 8 }}
            >
              Build: {String(message.data[0])}
            </div>
          ),
        },
        { id: "build-message" },
      );
    },
  };
}

export default function MessageRendererExample() {
  const addons = useMemo(() => [createMessageRendererAddon()], []);

  return (
    <Console
      messages={messages}
      addons={addons}
      title="messageRenderer"
      subtitle="Customize matching structured message rows."
    />
  );
}
