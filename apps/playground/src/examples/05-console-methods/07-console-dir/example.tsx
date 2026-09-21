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

exampleConsole.dir(
  {
    name: "Directory message",
    details: {
      nested: true,
      values: [1, 2, 3],
    },
  },
  {
    depth: 2,
    showHidden: false,
  },
);

export default function ConsoleDirExample() {
  return <Console messages={messages} subtitle="console.dir example" />;
}
