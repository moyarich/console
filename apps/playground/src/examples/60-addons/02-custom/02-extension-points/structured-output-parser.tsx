import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

function createStructuredOutputParserAddon(): ConsoleAddon {
  return {
    id: "example.structured-output-parser",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.structuredOutputParser,
        (text) => {
          const match = /^METRIC\s+(.+?)=(\d+(?:\.\d+)?)(\S+)$/.exec(
            text.trim(),
          );

          if (!match) return undefined;

          const [, label, value, unit] = match;
          return {
            kind: "metric",
            label,
            value: Number(value),
            unit,
          };
        },
        { id: "metric-parser" },
      );
    },
  };
}

const messages = ["METRIC Latency=42ms\n", "Plain terminal output\n"];

export default function StructuredOutputParserExample() {
  const addons = useMemo(() => [createStructuredOutputParserAddon()], []);

  return (
    <Console
      mode="ansi"
      messages={messages}
      addons={addons}
      title="structuredOutputParser"
      subtitle="Recover structured values embedded in process output."
    />
  );
}
