import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "strip-worker-prefix",
    process({ output, text }) {
      if (!text.startsWith("[worker] ")) return;
      return {
        data: output.data.replace("[worker] ", ""),
        metadata: { runtime: "worker" },
      };
    },
  },
  {
    id: "mark-task-status",
    process({ text, output }) {
      const match = /^TASK (START|DONE) (.+)$/.exec(text);
      if (!match) return;
      return {
        metadata: { taskStatus: match[1]?.toLowerCase() },
        structuredValue: {
          kind: "task",
          status: match[1]?.toLowerCase(),
          task: match[2],
          runtime: output.metadata.runtime,
        },
      };
    },
  },
];

function createProcessOutputProcessorAddon(): ConsoleAddon {
  return {
    id: "example.process-output-processor",
    activate(host) {
      for (const processor of processors) {
        host.extensions.register(
          consoleExtensionPoints.processOutputProcessor,
          processor,
          { id: processor.id },
        );
      }
    },
  };
}

const messages = [
  "[worker] TASK START compile app\n",
  "[worker] Compiling 42 modules...\n",
  "[worker] TASK DONE compile app\n",
];

export default function ProcessOutputProcessorExample() {
  const addons = useMemo(() => [createProcessOutputProcessorAddon()], []);
  return (
    <Console
      mode="terminal"
      messages={messages}
      addons={addons}
      title="Ordered addon processors"
      subtitle="Normalize, enrich metadata, then promote task events"
    />
  );
}
