import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.trace("Trace message");

export default function ConsoleTraceExample() {
  return <Console messages={messages} subtitle="console.trace example" />;
}
