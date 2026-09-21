import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const messages = [
  "$ npm run dev",
  "",
  "> web-app@1.0.0 dev",
  "> vite",
  "",
  `${ESC}1m${ESC}32mVITE v7.0.0${ESC}0m  ready in 241 ms`,
  "",
  `${ESC}32m➜${ESC}0m  Local:   ${ESC}36mhttp://localhost:5173/${ESC}0m`,
  `${ESC}32m➜${ESC}0m  Network: use --host to expose`,
  `${ESC}32m➜${ESC}0m  press h + enter to show help`,
];

export default function AnsiStdoutExample() {
  return (
    <Console
      mode="ansi"
      title="Terminal"
      subtitle="Dev server process output"
      messages={messages}
    />
  );
}
