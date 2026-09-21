import {
  Console,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [];
const exampleConsole = createConsoleProxy(messages);

exampleConsole.table([
  { name: "Ada", role: "Admin", active: true },
  { name: "Grace", role: "Editor", active: false },
]);

export default function ConsoleTableExample() {
  return <Console messages={messages} subtitle="console.table example" />;
}
