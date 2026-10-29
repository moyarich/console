import EventEmitter from "eventemitter3";
import type { ConsoleMessageData } from "../../types";

/** Event names emitted by the in-memory console event bus. */
export type ConsoleEventName = "message" | "clear";

type ConsoleEventArgs<T extends ConsoleEventName> = T extends "message"
  ? [message: ConsoleMessageData]
  : [];

type ConsoleEventListener<T extends ConsoleEventName> = (
  ...args: ConsoleEventArgs<T>
) => void;

/** Minimal typed event emitter used to connect console producers and consumers. */
export interface ConsoleEventEmitter {
  on<T extends ConsoleEventName>(
    type: T,
    listener: ConsoleEventListener<T>,
  ): () => void;

  off<T extends ConsoleEventName>(
    type: T,
    listener: ConsoleEventListener<T>,
  ): void;

  emit<T extends ConsoleEventName>(type: T, ...args: ConsoleEventArgs<T>): void;

  removeAllListeners(type?: ConsoleEventName): void;
}

/**
 * Creates an isolated typed event emitter backed by EventEmitter3.
 * Preserves the public unsubscribe-returning `on` contract.
 */
export function createConsoleEventEmitter(): ConsoleEventEmitter {
  const emitter = new EventEmitter();

  // The existing API treats repeated registration of the same listener as one
  // subscription. Keep that contract when delegating to EventEmitter3.
  const listeners = new Map<ConsoleEventName, Set<(...args: unknown[]) => void>>();

  const on: ConsoleEventEmitter["on"] = (type, listener) => {
    let registered = listeners.get(type);
    if (!registered) {
      registered = new Set();
      listeners.set(type, registered);
    }
    if (!registered.has(listener as (...args: unknown[]) => void)) {
      registered.add(listener as (...args: unknown[]) => void);
      emitter.on(type, listener);
    }
    return () => off(type, listener);
  };

  const off: ConsoleEventEmitter["off"] = (type, listener) => {
    listeners.get(type)?.delete(listener as (...args: unknown[]) => void);
    emitter.off(type, listener);
  };

  const emit: ConsoleEventEmitter["emit"] = (type, ...args) => {
    if (type === "message") {
      emitter.emit("message", args[0] as ConsoleMessageData);
    } else {
      emitter.emit("clear");
    }
  };

  const removeAllListeners = (type?: ConsoleEventName) => {
    if (type) {
      listeners.delete(type);
      emitter.removeAllListeners(type);
    } else {
      listeners.clear();
      emitter.removeAllListeners();
    }
  };

  return { on, off, emit, removeAllListeners };
}
