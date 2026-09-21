import { useRef, useState } from "react";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

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

function getAnsiFormattingOutput(): ConsoleStdoutEntry[] {
  return [
    { id: "command", data: "$ ansi-demo" },
    {
      id: "styles",
      data: [
        `${ESC}1mBold${ESC}0m`,
        `${ESC}2mDim${ESC}0m`,
        `${ESC}3mItalic${ESC}0m`,
        `${ESC}4mUnderline${ESC}0m`,
      ].join("  "),
    },
    {
      id: "standard-colors",
      data: [
        `${ESC}31mRed${ESC}0m`,
        `${ESC}32mGreen${ESC}0m`,
        `${ESC}33mYellow${ESC}0m`,
        `${ESC}34mBlue${ESC}0m`,
        `${ESC}35mMagenta${ESC}0m`,
        `${ESC}36mCyan${ESC}0m`,
      ].join("  "),
    },
    {
      id: "bright-colors",
      data: [
        `${ESC}91mBright red${ESC}0m`,
        `${ESC}92mBright green${ESC}0m`,
        `${ESC}94mBright blue${ESC}0m`,
      ].join("  "),
    },
    {
      id: "256-color",
      data: `${ESC}38;5;39m256-color foreground${ESC}0m  ${ESC}48;5;236mBackground color${ESC}0m`,
    },
    { id: "plain", data: "Plain output remains unchanged." },
  ];
}

export default function TerminalExample() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>([]);
  const runIdRef = useRef(0);

  const appendOutput = (entries: ConsoleStdoutEntry[]) => {
    const runId = ++runIdRef.current;

    setMessages((current) => [
      ...current,
      ...(current.length
        ? [{ id: `${runId}-separator`, data: "" }]
        : []),
      ...entries.map((entry, index) => ({
        ...entry,
        id: `${runId}-${entry.id ?? index}`,
      })),
    ]);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="button-row">
        <button
          type="button"
          onClick={() => appendOutput(getDevServerOutput())}
        >
          Run dev server
        </button>

        <button type="button" onClick={() => appendOutput(getBuildOutput())}>
          Run build
        </button>

        <button
          type="button"
          onClick={() => appendOutput(getAnsiFormattingOutput())}
        >
          Show ANSI formatting
        </button>
      </div>

      <Console
        mode="ansi"
        title="Terminal"
        subtitle="Process output appended to one terminal session"
        messages={messages}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
