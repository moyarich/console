import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleAnimationAddon } from "@moyarich/console-addon-animation";
const animation = createConsoleAnimationAddon({
  effect: "fade-slide",
  stagger: 0.08,
});
const messages: ConsoleMessageData[] = [
  { id: "a", method: "log" as const, data: ["First output"] },
  { id: "b", method: "log" as const, data: [{ interactive: true }] },
];
export default function Example() {
  return <Console messages={messages} addons={[animation]} />;
}
