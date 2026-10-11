import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleAnimationAddon } from "@moyarich/console-addon-animation";

const animation = createConsoleAnimationAddon({
  effect: "fade-slide",
  duration: 0.45,
  stagger: 0.24,
  wait: 0.5,
});

const messages: ConsoleMessageData[] = [
  { id: "05-stagger-and-wait-1", method: "log", depth: 0, data: ["Starting task"] },
  {
    id: "05-stagger-and-wait-2",
    method: "info", depth: 0,
    data: ["See https://example.com"],
  },
  {
    id: "05-stagger-and-wait-3",
    method: "log", depth: 0,
    data: [{ status: "ready", steps: 3 }],
  },
  {
    id: "05-stagger-and-wait-4",
    method: "warn", depth: 0,
    data: ["Finished with one warning"],
  },
];

export default function Example() {
  return <Console messages={messages} addons={[animation]} />;
}
