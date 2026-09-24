import { useMemo, type ReactNode } from "react";
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

export default function FrameDecoratorExample() {
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.frame-decorator",
        activate(host) {
          host.extensions.register(
            consoleExtensionPoints.frameDecorator,
            {
              render(context) {
                return (
                  <div
                    style={{
                      border: "1px dashed currentColor",
                      borderRadius: 12,
                      padding: 8,
                    }}
                  >
                    {context.renderDefault() as ReactNode}
                  </div>
                );
              },
            },
            { id: "example-frame" },
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
      title="frameDecorator"
      subtitle="Wrap the complete Console frame structurally."
    />
  );
}
