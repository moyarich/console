import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
let elapsedMs = 0;

const exampleConsole = createConsoleProxy({
  messages,
  timerNow: () => elapsedMs,
});

exampleConsole.time("compile");
elapsedMs = 500;
exampleConsole.timeEnd("compile");

export default function ConsoleTimeEndExample() {
  return <Console messages={messages} subtitle="console.timeEnd example" />;
}
