import { useState } from "react";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const chunks: ConsoleStdoutEntry[] = [
  {
    id: "prepare",
    data: "Preparing build...\n",
    stream: "stdout",
  },
  {
    id: "progress-10",
    data: `${ESC}36mProgress 10%${ESC}0m\r`,
    stream: "stdout",
  },
  {
    id: "progress-35",
    data: `${ESC}36mProgress 35%${ESC}0m\r`,
    stream: "stdout",
  },
  {
    id: "progress-72",
    data: `${ESC}36mProgress 72%${ESC}0m\r`,
    stream: "stdout",
  },
  {
    id: "progress-100",
    data: `${ESC}32mProgress 100%${ESC}0m\n`,
    stream: "stdout",
  },
  {
    id: "warning",
    data: `${ESC}33mwarning:${ESC}0m optional peer dependency missing\n`,
    stream: "stderr",
  },
  {
    id: "done",
    data: `${ESC}32m✓ Build complete${ESC}0m`,
    stream: "stdout",
  },
];

export default function CarriageReturnProgressExample() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>([]);
  const nextIndex = messages.length;
  const nextChunk = chunks[nextIndex];

  const appendNextChunk = () => {
    if (!nextChunk) {
      return;
    }

    setMessages((current) => [...current, nextChunk]);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="button-row">
        <button type="button" onClick={appendNextChunk} disabled={!nextChunk}>
          {nextChunk
            ? `Append chunk ${nextIndex + 1}/${chunks.length}`
            : "Demo complete"}
        </button>

        <button type="button" onClick={() => setMessages([])}>
          Reset
        </button>
      </div>

      <Console
        mode="ansi"
        title="Carriage-return progress"
        subtitle="Progress redraws one logical line while completed lines stay stable"
        messages={messages}
        resizable="vertical"
        style={{ height: 420, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
