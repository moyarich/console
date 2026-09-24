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
];

export default function EmptyStateRendererExample() {
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.empty-state-renderer",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.emptyStateRenderer,
            {
              mode: "console",
              match: (context) => context.hasMessages,
              render: () => (
                <div style={{ padding: 24, textAlign: "center" }}>
                  No messages match the current view.
                </div>
              ),
            },
            { id: "filtered-empty-state" },
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
      filter={() => false}
      title="emptyStateRenderer"
      subtitle="Customize an empty view without replacing normal output."
    />
  );
}
