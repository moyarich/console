import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const messages = [
  { id: "1", data: "$ npm run build", stream: "stdout" as const },
  { id: "2", data: "", stream: "stdout" as const },
  {
    id: "3",
    data: "> web-app@1.0.0 build\n> vite build",
    stream: "stdout" as const,
  },
  {
    id: "4",
    data: `${ESC}36mvite v7.0.0${ESC}0m building for production...`,
    stream: "stdout" as const,
  },
  {
    id: "5",
    data: `${ESC}32m✓${ESC}0m 42 modules transformed.`,
    stream: "stdout" as const,
  },
  {
    id: "6",
    data: `${ESC}33mwarning${ESC}0m Some chunks are larger than 500 kB after minification.`,
    stream: "stderr" as const,
  },
  {
    id: "7",
    data: "dist/index.html                  0.46 kB │ gzip: 0.30 kB",
    stream: "stdout" as const,
  },
  {
    id: "8",
    data: "dist/assets/index-D7fK2.js      192.14 kB │ gzip: 61.28 kB",
    stream: "stdout" as const,
  },
  {
    id: "9",
    data: `${ESC}32m✓ built in 1.18s${ESC}0m`,
    stream: "stdout" as const,
  },
];

export default function AnsiBuildOutputExample() {
  return (
    <Console
      mode="ansi"
      title="Terminal"
      subtitle="Build output with optional stream metadata"
      messages={messages}
    />
  );
}
