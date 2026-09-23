import { useMemo } from "react";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import { createConsoleDiagnosticsAddon } from "@moyarich/console-addon-diagnostics";
import "@moyarich/console/styles.css";

const structuredMessages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
    source: "preview:api-client",
  },
  {
    id: "warning",
    method: "warn",
    depth: 0,
    data: ["Cache nearing capacity", { usage: "86%" }],
    source: "preview:cache",
  },
];

const processMessages = ["Progress 10%\r", "Progress 60%\r", "Progress 100%\n"];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "diagnostics-example-build-status",
    process(output) {
      if (!output.data.includes("Progress 100%")) return;

      return {
        data: output.data.replace("Progress 100%", "Build complete"),
        metadata: { phase: "build", complete: true },
      };
    },
  },
];

export default function DiagnosticsExample() {
  const addons = useMemo(() => [createConsoleDiagnosticsAddon()], []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Console
        messages={structuredMessages}
        addons={addons}
        title="Structured diagnostics"
        subtitle="Inspect retained and logically visible ConsoleMessageData."
        style={{ minHeight: 220 }}
      />

      <Console
        mode="ansi"
        messages={processMessages}
        processors={processors}
        addons={addons}
        title="ANSI pipeline diagnostics"
        subtitle="Compare rawEntries with normalized and processor-resolved output."
        style={{ minHeight: 220 }}
      />
    </div>
  );
}
