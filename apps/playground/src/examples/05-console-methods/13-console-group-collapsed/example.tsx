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

exampleConsole.groupCollapsed("Request details");
exampleConsole.log("GET /api/users");
exampleConsole.log({ status: 200, cached: true });
exampleConsole.groupEnd();

export default function ConsoleGroupCollapsedExample() {
  return (
    <Console messages={messages} subtitle="console.groupCollapsed example" />
  );
}
