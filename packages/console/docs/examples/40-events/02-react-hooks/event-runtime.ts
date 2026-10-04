import {
  createConsoleEventEmitter,
  createConsoleProxy,
} from "@moyarich/console";

export function createEventRuntime() {
  const events = createConsoleEventEmitter();
  const console = createConsoleProxy({
    events,
    source: "host-owned-state",
  });

  return { events, console };
}
