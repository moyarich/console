import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

function createProcessOutputProcessorAddon(): ConsoleAddon {
  return {
    id: "example.process-output-processor",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.processOutputProcessor,
        {
          id: "build-status",
          process(output) {
            if (!output.data.includes("BUILD_OK")) return;

            return {
              data: output.data.replace("BUILD_OK", "Build complete"),
              metadata: { phase: "build", complete: true },
            };
          },
        },
        { id: "build-status" },
      );
    },
  };
}

const messages = ["Compiling...\n", "BUILD_OK\n"];

export default function ProcessOutputProcessorExample() {
  const addons = useMemo(() => [createProcessOutputProcessorAddon()], []);

  return (
    <Console
      mode="ansi"
      messages={messages}
      addons={addons}
      title="processOutputProcessor"
      subtitle="Transform resolved process output before it is rendered."
    />
  );
}
