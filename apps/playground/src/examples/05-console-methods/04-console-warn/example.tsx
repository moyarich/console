import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.warn("Warning message", { retryable: true });

export default function ConsoleWarnExample() {
  return <Console messages={messages} subtitle="console.warn example" />;
}
