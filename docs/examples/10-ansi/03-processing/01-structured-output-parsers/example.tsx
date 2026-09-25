import { useState } from "react";
import {
  Console,
  type ConsoleStdoutEntry,
  type ConsoleStructuredOutputParser,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const diagnosticParser: ConsoleStructuredOutputParser = (context) => {
  const { text } = context;
  const match = text
    .trim()
    .match(/^ERROR\s+(TS\d+)\s+(.+?):(\d+):(\d+)\s+-\s+(.+)$/);

  if (!match) {
    return undefined;
  }

  return {
    kind: "typescript-diagnostic",
    severity: "error",
    code: match[1],
    file: match[2],
    line: Number(match[3]),
    column: Number(match[4]),
    message: match[5],
    stream: context.stream,
    entryId: context.id,
  };
};

const testEventParser: ConsoleStructuredOutputParser = (context) => {
  const { text } = context;
  const match = text.trim().match(/^TEST\s+(PASS|FAIL)\s+(.+)\s+\((\d+)ms\)$/);

  if (!match) {
    return undefined;
  }

  return {
    kind: "test-event",
    status: match[1]?.toLowerCase(),
    test: match[2],
    durationMs: Number(match[3]),
    stream: context.stream,
    entryIndex: context.index,
  };
};

const structuredOutputParsers = [diagnosticParser, testEventParser];

function getOutput(): ConsoleStdoutEntry[] {
  return [
    {
      id: "diagnostic",
      data: `${ESC}31mERROR TS2322 index.ts:12:7 - Type 'number' is not assignable to type 'string'.${ESC}0m`,
      stream: "stderr",
    },
    {
      id: "test",
      data: `${ESC}32mTEST PASS redirects unauthenticated users (18ms)${ESC}0m`,
      stream: "stdout",
    },
    {
      id: "json",
      data: '{"request":{"method":"GET","status":200}}',
      stream: "stdout",
    },
    {
      id: "plain",
      data: `${ESC}33mWatching for file changes...${ESC}0m`,
      stream: "stdout",
    },
  ];
}

export default function StructuredOutputParsersExample() {
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
        title="Structured output parsers"
        subtitle="Custom parsers run before built-in strict JSON parsing"
        messages={messages}
        structuredOutputParsers={structuredOutputParsers}
        parseStructuredOutput
        style={{ height: 440, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
