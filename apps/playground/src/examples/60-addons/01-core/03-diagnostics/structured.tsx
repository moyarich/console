import { useMemo } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleDiagnosticsAddon } from "@moyarich/console-addon-diagnostics";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
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

export default function StructuredDiagnosticsExample() {
  const addons = useMemo(() => [createConsoleDiagnosticsAddon()], []);

  return (
    <Console
      messages={messages}
      addons={addons}
      title="Structured diagnostics"
      subtitle="Inspect retained and logically visible ConsoleMessageData."
    />
  );
}
