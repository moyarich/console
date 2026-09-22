import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

function TerminalSurface({
  entries,
}: {
  entries: readonly (ConsoleStdoutEntry | string)[];
}) {
  return (
    <div
      role="log"
      aria-label="Custom terminal output"
      style={{
        minHeight: 180,
        padding: 12,
        fontFamily: "monospace",
        background: "#111",
        color: "#f5f5f5",
      }}
    >
      {entries.map((entry, index) => {
        const text = typeof entry === "string" ? entry : entry.data;

        return (
          <div key={typeof entry === "string" ? index : entry.id ?? index}>
            {text}
          </div>
        );
      })}
    </div>
  );
}

function createTerminalSurfaceAddon(): ConsoleAddon {
  return {
    id: "example.terminal-surface",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        {
          mode: "ansi",
          render(context) {
            if (context.mode !== "ansi") return undefined;

            return <TerminalSurface entries={context.entries} />;
          },
        },
        {
          id: "terminal-surface",
          priority: 100,
        },
      );
    },
  };
}

const entries: readonly ConsoleStdoutEntry[] = [
  {
    id: "boot",
    stream: "stdout",
    data: "$ npm run build",
  },
  {
    id: "progress",
    stream: "stdout",
    data: "building application...",
  },
  {
    id: "done",
    stream: "stdout",
    data: "done in 842ms",
  },
];

export default function OutputSurfaceAddonExample() {
  const addons = useMemo(() => [createTerminalSurfaceAddon()], []);

  return (
    <Console
      mode="ansi"
      messages={entries}
      addons={addons}
      subtitle="An addon replaces the built-in ConsoleStdout surface"
    />
  );
}
