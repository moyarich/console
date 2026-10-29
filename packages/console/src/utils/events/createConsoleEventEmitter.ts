import EventEmitter from "eventemitter3";
import type { ConsoleMessageData } from "../../types";

/** Event names emitted by a Console event emitter. */
export type ConsoleEventName = "message" | "clear";

/** Strongly typed event signatures for console producers and consumers. */
export interface ConsoleEvents {
  message: (message: ConsoleMessageData) => void;
  clear: () => void;
}

/** Node-style event emitter: on/once/off return the emitter, emit returns boolean. */
export type ConsoleEventEmitter = EventEmitter<ConsoleEvents>;

/** Creates a separate event emitter for each console producer or consumer. */
export function createConsoleEventEmitter(): ConsoleEventEmitter {
  return new EventEmitter<ConsoleEvents>();
}
