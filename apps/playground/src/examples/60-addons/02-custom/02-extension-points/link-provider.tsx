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
    id: "task",
    method: "info",
    data: ["Build tracked by TASK-1042."],
    depth: 0,
  },
];

export default function LinkProviderExample() {
  const [lastOpened, setLastOpened] = useState("none");

  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.link-provider",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.linkProvider,
            {
              id: "task-links",
              provideLinks(text) {
                return Array.from(text.matchAll(/TASK-\d+/g), (match) => ({
                  text: match[0],
                  start: match.index,
                  end: match.index + match[0].length,
                  title: "Open task",
                  action: ({ link }) => setLastOpened(link.text),
                }));
              },
            },
            { id: "task-links" },
          );
        },
      },
    ],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Console messages={messages} addons={addons} title="linkProvider" />
      <div role="status">
        Last opened task: <strong>{lastOpened}</strong>
      </div>
    </div>
  );
}
