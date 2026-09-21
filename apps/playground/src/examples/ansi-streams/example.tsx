import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const messages = [
  {
    id: "server",
    data: `${ESC}32mServer listening on http://localhost:3000${ESC}0m`,
    stream: "stdout" as const,
  },
  {
    id: "request",
    data: "GET /api/users 200 18ms",
    stream: "stdout" as const,
  },
  {
    id: "warning",
    data: `${ESC}33mDeprecationWarning:${ESC}0m legacy config option detected`,
    stream: "stderr" as const,
  },
  {
    id: "database",
    data: `${ESC}31mDatabase connection failed; retrying...${ESC}0m`,
    stream: "stderr" as const,
  },
  "This line has no stream metadata and is still valid.",
];

export default function AnsiStreamsExample() {
  return (
    <Console
      mode="ansi"
      title="Process output"
      subtitle="Optional stdout/stderr metadata"
      messages={messages}
    />
  );
}
