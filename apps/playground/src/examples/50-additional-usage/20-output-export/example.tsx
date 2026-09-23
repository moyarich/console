import { useMemo } from "react";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import { createConsoleExportAddon } from "@moyarich/console-addon-export";
import "@moyarich/console/styles.css";

const structuredMessages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
  },
  {
    id: "warning",
    method: "warn",
    depth: 0,
    data: ["Cache nearing capacity", { usage: "86%" }],
  },
];

const escape = String.fromCharCode(27);
const processMessages = [
  `${escape}[36mBuilding application...${escape}[0m\n`,
  "Progress 25%\r",
  "Progress 75%\r",
  `${escape}[32mProgress 100%${escape}[0m\n`,
];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "export-example-build-status",
    process(output) {
      if (!output.data.includes("Progress 100%")) return;

      return {
        data: output.data.replace("Progress 100%", "Build complete"),
        metadata: { phase: "build", complete: true },
      };
    },
  },
];

export default function OutputExportExample() {
  const structuredAddons = useMemo(
    () => [createConsoleExportAddon({ fileName: "structured-console" })],
    [],
  );
  const ansiAddons = useMemo(
    () => [createConsoleExportAddon({ fileName: "process-output" })],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13 }}>
        Open each console&apos;s action menu to copy the logical view as JSON or
        download text/JSON. The addon is additive; existing core actions stay
        available.
      </p>

      <Console
        messages={structuredMessages}
        addons={structuredAddons}
        title="Structured export"
        subtitle="Exports underlying ConsoleMessageData rather than renderer text."
        style={{ minHeight: 220 }}
      />

      <Console
        mode="ansi"
        messages={processMessages}
        processors={processors}
        addons={ansiAddons}
        title="ANSI export"
        subtitle="Exports the resolved logical process view after CR normalization and processors."
        style={{ minHeight: 220 }}
      />
    </div>
  );
}
