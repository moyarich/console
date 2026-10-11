import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleAnimationAddon } from "@moyarich/console-addon-animation";

const animation = createConsoleAnimationAddon({
  effect: "reveal",
  duration: 1.4,
  stagger: 0.12,
  wait: 0,
});

const messages: ConsoleMessageData[] = [
  { id: "06-reveal-1", method: "log", depth: 0, data: ["Starting task"] },
  {
    id: "06-reveal-2",
    method: "info",
    depth: 0,
    data: ["See https://example.com"],
  },
  {
    id: "06-reveal-3",
    method: "log",
    depth: 0,
    data: [{ status: "ready", steps: 3 }],
  },
  {
    id: "06-reveal-4",
    method: "warn",
    depth: 0,
    data: ["Finished with one warning"],
  },
];

export default function Example() {
  return <Console messages={messages} addons={[animation]} />;
}
