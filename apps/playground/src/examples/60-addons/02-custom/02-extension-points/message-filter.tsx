import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  { id: "visible", method: "log", data: ["Visible log"], depth: 0 },
  { id: "hidden", method: "debug", data: ["Hidden debug"], depth: 0 },
];

export default function MessageFilterExample() {
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.message-filter",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.messageFilter,
            ({ message }) => message.method !== "debug",
            { id: "hide-debug" },
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
      title="messageFilter"
      subtitle="Filter the logical structured-message view."
    />
  );
}
