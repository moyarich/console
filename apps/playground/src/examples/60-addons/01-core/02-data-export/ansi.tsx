import { useMemo } from "react";
import { Console, type ConsoleProcessOutputProcessor } from "@moyarich/console";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";
import "@moyarich/console/styles.css";

const escape = String.fromCharCode(27);
const messages = [
  `${escape}[36mBuilding application...${escape}[0m\n`,
  "Progress 25%\r",
  "Progress 75%\r",
  `${escape}[32mProgress 100%${escape}[0m\n`,
];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "export-build-status",
    process(output) {
      if (!output.data.includes("Progress 100%")) return;

      return {
        data: output.data.replace("Progress 100%", "Build complete"),
        metadata: { phase: "build", complete: true },
      };
    },
  },
];

export default function AnsiDataExportExample() {
  const addons = useMemo(
    () => [createConsoleDataExportAddon({ fileName: "process-output" })],
    [],
  );

  return (
    <Console
      mode="ansi"
      messages={messages}
      processors={processors}
      addons={addons}
      title="ANSI data export"
      subtitle="Exports the normalized and processor-resolved process view."
    />
  );
}
