import { useState } from "react";
import * as ts from "typescript";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const FILE_NAME = "index.ts";

const TYPESCRIPT_SOURCE = `
interface User {
  name: string;
  score: number;
}

const user: User = {
  name: "Ada",
  score: 42,
};

const message: string = ;
console.log(message, user);
`;

const diagnosticHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => "/workspace",
  getNewLine: () => "\n",
};

function compileTypeScript(): ConsoleStdoutEntry[] {
  const result = ts.transpileModule(TYPESCRIPT_SOURCE, {
    fileName: FILE_NAME,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      strict: true,
    },
  });

  const diagnostics = result.diagnostics ?? [];

  if (!diagnostics.length) {
    return [
      { id: "command", data: "$ npx tsc index.ts" },
      { id: "success", data: "TypeScript compiled successfully." },
    ];
  }

  return [
    { id: "command", data: "$ npx tsc index.ts" },
    {
      id: "diagnostics",
      data: ts.formatDiagnosticsWithColorAndContext(
        diagnostics,
        diagnosticHost,
      ),
      stream: "stderr",
    },
  ];
}

export default function TypeScriptCompileErrorExample() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>(() =>
    compileTypeScript(),
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button type="button" onClick={() => setMessages(compileTypeScript())}>
        Compile TypeScript
      </button>

      <section className="controls-card">
        <h2>TypeScript source</h2>
        <pre className="transport-output">{TYPESCRIPT_SOURCE}</pre>
      </section>

      <Console
        mode="ansi"
        title="Terminal"
        subtitle="TypeScript compiler diagnostics"
        messages={messages}
      />
    </div>
  );
}
