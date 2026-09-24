import { useMemo } from "react";
import { Console, type ConsoleProcessOutputProcessor } from "@moyarich/console";
import { createConsoleDiagnosticsAddon } from "@moyarich/console-addon-diagnostics";
import "@moyarich/console/styles.css";

const messages = ["Progress 10%\r", "Progress 60%\r", "Progress 100%\n"];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "diagnostics-build-status",
    process({ output }) {
      if (!output.data.includes("Progress 100%")) return;

      return {
        data: output.data.replace("Progress 100%", "Build complete"),
        metadata: { phase: "build", complete: true },
      };
    },
  },
];

export default function AnsiDiagnosticsExample() {
  const addons = useMemo(() => [createConsoleDiagnosticsAddon()], []);

  return (
    <Console
      mode="ansi"
      messages={messages}
      processors={processors}
      addons={addons}
      title="ANSI pipeline diagnostics"
      subtitle="Compare raw chunks with normalized and processor-resolved output."
    />
  );
}
