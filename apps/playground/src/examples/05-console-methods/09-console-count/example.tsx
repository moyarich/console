import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.count("requests");
exampleConsole.count("requests");
exampleConsole.count("requests");

export default function ConsoleCountExample() {
  return <Console messages={messages} subtitle="console.count example" />;
}
