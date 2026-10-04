import { useMemo } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
    timestamp: Date.UTC(2026, 8, 23, 4, 0, 0),
    source: "preview:api-client",
  },
  {
    id: "warning",
    method: "warn",
    depth: 0,
    data: ["Cache nearing capacity", { usage: "86%" }],
    timestamp: Date.UTC(2026, 8, 23, 4, 0, 2),
    source: "preview:cache",
  },
];

export default function StructuredDataExportExample() {
  const addons = useMemo(
    () => [createConsoleDataExportAddon({ fileName: "structured-console" })],
    [],
  );

  return (
    <Console
      messages={messages}
      addons={addons}
      title="Structured data export"
      subtitle="Exports underlying ConsoleMessageData rather than renderer text."
    />
  );
}
