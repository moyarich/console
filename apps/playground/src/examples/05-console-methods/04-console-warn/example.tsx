import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy({
  onEvent(event) {
    if (event.type === "message") {
      messages.push(event.message);
    }
  },
});

exampleConsole.warn("Warning message", { retryable: true });

export default function ConsoleWarnExample() {
  return <Console messages={messages} subtitle="console.warn example" />;
}
