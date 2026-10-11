import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleAnimationAddon } from "@moyarich/console-addon-animation";

const animation = createConsoleAnimationAddon({
  effect: "fade-slide",
  duration: 0.45,
  stagger: 0.12,
  wait: 0,
});

const messages: ConsoleMessageData[] = [
  { id: "03-fade-slide-1", method: "log", data: ["Starting task"] },
  { id: "03-fade-slide-2", method: "info", data: ["See https://example.com"] },
  { id: "03-fade-slide-3", method: "log", data: [{ status: "ready", steps: 3 }] },
  { id: "03-fade-slide-4", method: "warn", data: ["Finished with one warning"] },
];

export default function Example() {
  return <Console messages={messages} addons={[animation]} />;
}
