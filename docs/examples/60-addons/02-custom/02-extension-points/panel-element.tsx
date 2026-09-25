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

export default function PanelElementExample() {
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.panel-element",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.panelElement,
            {
              id: "example.status",
              placement: "before-output",
              render(context) {
                return (
                  <div role="status" style={{ fontSize: 12 }}>
                    Addon panel element ·{" "}
                    {context.hasMessages ? "output ready" : "waiting"}
                  </div>
                );
              },
            },
            { id: "example.status" },
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
      title="panelElement"
      subtitle="Contribute persistent UI without wrapping the frame."
    />
  );
}
