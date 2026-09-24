import { useMemo } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleFilteringAddon } from "@moyarich/console-addon-filtering";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "client-ready",
    method: "log",
    data: ["Application ready", { route: "/dashboard" }],
    depth: 0,
    source: "client",
  },
  {
    id: "api-request",
    method: "info",
    data: ["GET /api/projects", { status: 200, durationMs: 84 }],
    depth: 0,
    source: "api",
  },
  {
    id: "worker-cache",
    method: "warn",
    data: ["Cache nearing capacity", { usage: "86%" }],
    depth: 0,
    source: "worker",
  },
  {
    id: "api-error",
    method: "error",
    data: ["POST /api/projects failed", { status: 503 }],
    depth: 0,
    source: "api",
  },
  {
    id: "worker-debug",
    method: "debug",
    data: ["Retry scheduled", { attempt: 2 }],
    depth: 0,
    source: "worker",
  },
  {
    id: "host-hidden",
    method: "debug",
    data: ["Internal host diagnostic"],
    depth: 0,
    source: "client",
  },
];

export default function FilteringAddonExample() {
  const filteringAddon = useMemo(() => createConsoleFilteringAddon(), []);
  const addons = useMemo(() => [filteringAddon], [filteringAddon]);

  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <Console
        messages={messages}
        addons={addons}
        filter={(message) => message.id !== "host-hidden"}
        title="Filtered console"
        subtitle="Addon filters compose with the host predicate."
        style={{ height: 320 }}
      />
    </div>
  );
}
