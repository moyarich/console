import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.error("Error message", new Error("Example failure"));

export default function ConsoleErrorExample() {
  return <Console messages={messages} subtitle="console.error example" />;
}
