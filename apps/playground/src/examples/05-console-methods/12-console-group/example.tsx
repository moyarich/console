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

exampleConsole.group("Build");
exampleConsole.log("Compiling application");
exampleConsole.log("Writing output", { files: 42 });
exampleConsole.groupEnd();

export default function ConsoleGroupExample() {
  return <Console messages={messages} subtitle="console.group example" />;
}
