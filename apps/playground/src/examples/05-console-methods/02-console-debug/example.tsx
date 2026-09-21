import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.debug("Debug message", { phase: "render" });

export default function ConsoleDebugExample() {
  return <Console messages={messages} subtitle="console.debug example" />;
}
