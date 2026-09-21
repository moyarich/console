import { useMemo, useState } from "react";
import * as ts from "typescript";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";
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

type TerminalScenario = "dev-server" | "build" | "compile-error";

const diagnosticHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => "/workspace",
  getNewLine: () => "\n",
};

function getDevServerOutput(): ConsoleStdoutEntry[] {
  return [
    { id: "command", data: "$ npm run dev" },
    { id: "script", data: "> web-app@1.0.0 dev\n> vite" },
    {
      id: "ready",
      data: `${ESC}1m${ESC}32mVITE v7.0.0${ESC}0m  ready in 241 ms`,
    },
    {
      id: "local",
      data: `${ESC}32m➜${ESC}0m  Local:   ${ESC}36mhttp://localhost:5173/${ESC}0m`,
    },
    {
      id: "network",
      data: `${ESC}32m➜${ESC}0m  Network: use --host to expose`,
    },
  ];
}

function getBuildOutput(): ConsoleStdoutEntry[] {
  return [
    { id: "command", data: "$ npm run build", stream: "stdout" },
    {
      id: "script",
      data: "> web-app@1.0.0 build\n> vite build",
      stream: "stdout",
    },
    {
      id: "building",
      data: `${ESC}36mvite v7.0.0${ESC}0m building for production...`,
      stream: "stdout",
    },
    {
      id: "transformed",
      data: `${ESC}32m✓${ESC}0m 42 modules transformed.`,
      stream: "stdout",
    },
    {
      id: "warning",
      data: `${ESC}33mwarning${ESC}0m Some chunks are larger than 500 kB after minification.`,
      stream: "stderr",
    },
    {
      id: "asset",
      data: "dist/assets/index-D7fK2.js  192.14 kB │ gzip: 61.28 kB",
      stream: "stdout",
    },
    {
      id: "done",
      data: `${ESC}32m✓ built in 1.18s${ESC}0m`,
      stream: "stdout",
    },
  ];
}

function getCompileErrorOutput(): ConsoleStdoutEntry[] {
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

  return [
    { id: "command", data: "$ npx tsc index.ts" },
    ...(diagnostics.length
      ? [
          {
            id: "diagnostics",
            data: ts.formatDiagnosticsWithColorAndContext(
              diagnostics,
              diagnosticHost,
            ),
            stream: "stderr" as const,
          },
        ]
      : [{ id: "success", data: "TypeScript compiled successfully." }]),
  ];
}

function getScenarioOutput(scenario: TerminalScenario): ConsoleStdoutEntry[] {
  switch (scenario) {
    case "build":
      return getBuildOutput();
    case "compile-error":
      return getCompileErrorOutput();
    case "dev-server":
    default:
      return getDevServerOutput();
  }
}

const scenarioLabels: Record<TerminalScenario, string> = {
  "dev-server": "Dev server",
  build: "Build",
  "compile-error": "Compile error",
};

export default function TerminalExample() {
  const [scenario, setScenario] = useState<TerminalScenario>("dev-server");
  const messages = useMemo(() => getScenarioOutput(scenario), [scenario]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="button-row">
        {(Object.keys(scenarioLabels) as TerminalScenario[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={scenario === value}
            onClick={() => setScenario(value)}
          >
            {scenarioLabels[value]}
          </button>
        ))}
      </div>

      {scenario === "compile-error" && (
        <section className="controls-card">
          <h2>TypeScript source</h2>
          <pre className="transport-output">{TYPESCRIPT_SOURCE}</pre>
        </section>
      )}

      <Console
        mode="ansi"
        title="Terminal"
        subtitle={
          scenario === "dev-server"
            ? "Dev server process output"
            : scenario === "build"
              ? "Build output with optional stream metadata"
              : "TypeScript compiler diagnostics"
        }
        messages={messages}
      />
    </div>
  );
}
