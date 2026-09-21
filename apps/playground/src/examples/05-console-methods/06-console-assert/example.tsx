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

exampleConsole.assert(true, "This assertion is not emitted");
exampleConsole.assert(false, "Assertion message", { expected: true });

export default function ConsoleAssertExample() {
  return <Console messages={messages} subtitle="console.assert example" />;
}
