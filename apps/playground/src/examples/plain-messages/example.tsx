import {
  Console,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    method: "log",
    data: [
      "Hello from plain messages",
      { package: "@moyarich/console" },
    ],
    depth: 0,
  },
  {
    method: "info",
    data: ["No events or useConsoleMessages required."],
    depth: 0,
  },
  {
    method: "warn",
    data: ["Pass ConsoleMessageData[] directly to Console."],
    depth: 0,
  },
];

export default function PlainMessagesExample() {
  return (
    <Console
      messages={messages}
      subtitle="Plain ConsoleMessageData objects"
    />
  );
}
