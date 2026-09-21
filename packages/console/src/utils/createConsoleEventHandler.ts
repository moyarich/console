import type { ConsoleEventHandler } from "../types";
import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";

export function createConsoleEventHandler(
  events: ConsoleEventEmitter,
): ConsoleEventHandler {
  return (event) => {
    if (event.type === "message") {
      events.emit("message", event.message);
      return;
    }

    events.emit("clear");
  };
}
