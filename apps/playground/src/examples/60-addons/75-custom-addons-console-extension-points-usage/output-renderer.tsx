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
    data: ["Build complete", { durationMs: 842 }],
    depth: 0,
  },
  {
    id: "request",
    method: "log",
    data: ["Request complete", { status: 200 }],
    depth: 0,
  },
];

function createOutputRendererAddon(): ConsoleAddon {
  return {
    id: "example.output-renderer",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        {
          mode: "console",
          render(context) {
            if (context.mode !== "console") return undefined;

            return (
              <div style={{ padding: 12 }}>
                Custom output surface: {context.messages.length} messages
              </div>
            );
          },
        },
        { id: "summary-output" },
      );
    },
  };
}

export default function OutputRendererExample() {
  const addons = useMemo(() => [createOutputRendererAddon()], []);

  return (
    <Console
      messages={messages}
      addons={addons}
      title="outputRenderer"
      subtitle="Replace the complete output surface."
    />
  );
}
