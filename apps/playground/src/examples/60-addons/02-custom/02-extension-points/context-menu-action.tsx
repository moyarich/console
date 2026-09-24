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
    method: "log",
    data: ["Request complete", { status: 200 }],
    depth: 0,
  },
];

export default function ContextMenuActionExample() {
  const [lastTarget, setLastTarget] = useState("none");

  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.context-menu-action",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.contextMenuAction,
            {
              id: "inspect-target",
              label: "Inspect target",
              onSelect: ({ kind }) => setLastTarget(kind),
            },
            { id: "inspect-target" },
          );
        },
      },
    ],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Console messages={messages} addons={addons} title="contextMenuAction" />
      <div role="status">
        Last context target: <strong>{lastTarget}</strong>
      </div>
    </div>
  );
}
