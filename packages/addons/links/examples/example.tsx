import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleLinksAddon } from "@moyarich/console-addon-links";

const messages: ConsoleMessageData[] = [
  { id: "docs", method: "log", data: ["Docs: https://example.com/docs."], depth: 0 },
  { id: "nested", method: "info", data: [{ link: "http://localhost:5173" }], depth: 0 },
];

const links = createConsoleLinksAddon();

export default function Example() {
  return <Console messages={messages} addons={[links]} />;
}
