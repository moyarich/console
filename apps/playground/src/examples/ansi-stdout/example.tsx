import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";

const ESC = "\u001b[";

const messages = [
  `${ESC}1mBold output${ESC}0m`,
  `${ESC}32mSuccess: build completed${ESC}0m`,
  `${ESC}33mWarning: bundle size increased${ESC}0m`,
  {
    id: "stderr-example",
    data: `${ESC}31mError: example failure${ESC}0m`,
    stream: "stderr",
  },
  `${ESC}38;5;39m256-color ANSI output${ESC}0m`,
  "Plain stdout remains unchanged",
];

export default function AnsiStdoutExample() {
  return <Console mode="ansi" messages={messages} />;
}
