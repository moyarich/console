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
    id: "ready",
    method: "log",
    data: ["Application ready"],
    depth: 0,
  },
];

export default function PanelActionExample() {
  const [lastAction, setLastAction] = useState("none");

  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.panel-action",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.panelAction,
            {
              id: "refresh-preview",
              label: "Refresh preview",
              onSelect: () => setLastAction("Refresh preview"),
            },
            { id: "refresh-preview" },
          );
        },
      },
    ],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Console messages={messages} addons={addons} title="panelAction" />
      <div role="status">
        Last panel action: <strong>{lastAction}</strong>
      </div>
    </div>
  );
}
