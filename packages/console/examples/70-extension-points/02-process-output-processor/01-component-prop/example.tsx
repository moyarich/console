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
    process({ output, text }) {
      if (!text.startsWith("[worker] ")) return;
      return {
        data: output.data.replace("[worker] ", ""),
        metadata: { runtime: "worker" },
      };
    },
  },
  {
    id: "task-event",
    process({ output, text }) {
      const match = /^TASK (START|DONE) (.+)$/.exec(text);
      if (!match) return;
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

const initial: ConsoleStdoutEntry[] = [
  { id: "start", data: `${ESC}36m[worker] TASK START compile app${ESC}0m`, stream: "stdout" },
  { id: "plain", data: `${ESC}33m[worker] compiling 42 modules...${ESC}0m`, stream: "stdout" },
];
let nextId = 0;

export default function ProcessOutputProcessorsExample() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>(initial);

  const addEntry = () => {
    const id = ++nextId;
    setMessages((current) => [
      ...current,
      {
        id: `done-${id}`,
        data: `${ESC}32m[worker] TASK DONE compile app #${id}${ESC}0m`,
        stream: "stdout",
      },
    ]);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="button-row">
        <button type="button" onClick={addEntry}>Append task event</button>
        <button type="button" onClick={() => setMessages(initial)}>Reset sample</button>
        <button type="button" onClick={() => setMessages([])}>Clear output</button>
      </div>
      <Console
        mode="terminal"
        title="Process-output processors"
        subtitle="Append messages to see ordered transforms and enrichment"
        messages={messages}
        processors={processors}
        style={{ height: 420, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
