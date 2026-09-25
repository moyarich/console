import { Console, type ConsoleMessageData } from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    method: "log",
    data: ["Request complete", { status: 200, durationMs: 84 }],
    depth: 0,
  },
  {
    method: "info",
    data: ["Cache hit", { key: "users:list" }],
    depth: 0,
  },
  {
    method: "warn",
    data: ["Cache nearing capacity", { usage: "86%" }],
    depth: 0,
  },
];

export default function PlainMessagesExample() {
  return (
    <Console messages={messages} subtitle="Plain ConsoleMessageData objects" />
  );
}
