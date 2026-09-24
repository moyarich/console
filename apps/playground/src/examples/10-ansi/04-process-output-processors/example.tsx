import { useState } from "react";
import {
  Console,
  type ConsoleProcessOutputProcessor,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "worker-prefix",
    process: (output, context) => {
      if (!context.text.startsWith("[worker] ")) {
        return undefined;
      }

      return {
        data: output.data.replace("[worker] ", ""),
        metadata: { runtime: "worker" },
      };
    },
  },
  {
    id: "task-event",
    process: (output, context) => {
      const match = context.text.match(/^TASK (START|DONE) (.+)$/);

      if (!match) {
        return undefined;
      }

      return {
        structuredValue: {
          kind: "task-event",
          status: match[1]?.toLowerCase(),
          task: match[2],
          runtime: output.metadata.runtime,
        },
        metadata: { taskStatus: match[1]?.toLowerCase() },
      };
    },
  },
];

function getOutput(): ConsoleStdoutEntry[] {
  return [
    {
      id: "start",
      data: `${ESC}36m[worker] TASK START compile app${ESC}0m`,
      stream: "stdout",
    },
    {
      id: "plain",
      data: `${ESC}33m[worker] compiling 42 modules...${ESC}0m`,
      stream: "stdout",
    },
    {
      id: "done",
      data: `${ESC}32m[worker] TASK DONE compile app${ESC}0m`,
      stream: "stdout",
    },
  ];
}

export default function ProcessOutputProcessorsExample() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>(getOutput);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="button-row">
        <button type="button" onClick={() => setMessages(getOutput())}>
          Load sample output
        </button>
      </div>

      <Console
        mode="ansi"
        title="Process-output processors"
        subtitle="Ordered transforms and enrichment before ANSI rendering"
        messages={messages}
        processors={processors}
        style={{ height: 420, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
