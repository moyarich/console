import type { ConsoleEvent } from "../../types";
import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";

type ConsoleEventHandlers = {
  [K in ConsoleEvent["type"]]: (
    event: Extract<ConsoleEvent, { type: K }>,
  ) => void;
};

/**
 * Creates a transport-facing handler that forwards a discriminated
 * {@link ConsoleEvent} into a {@link ConsoleEventEmitter}.
 */
export function createConsoleEventHandler(events: ConsoleEventEmitter) {
  const handlers: ConsoleEventHandlers = {
    message: (event) => {
      events.emit("message", event.message);
    },
    clear: () => {
      events.emit("clear");
    },
  };

  return (event: ConsoleEvent) => {
    const handler = handlers[event.type] as (event: ConsoleEvent) => void;
    handler(event);
  };
}
