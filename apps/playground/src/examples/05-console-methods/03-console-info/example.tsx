import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.info("Info message", { version: "1.0.0" });

export default function ConsoleInfoExample() {
  return <Console messages={messages} subtitle="console.info example" />;
}
