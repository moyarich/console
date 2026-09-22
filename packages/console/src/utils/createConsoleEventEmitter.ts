import type { ConsoleMessageData } from "../types";

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
 * Creates an isolated typed event emitter for console message and clear events.
 *
 * Listener iteration uses a snapshot so listeners may safely unsubscribe while
 * an event is being delivered.
 */
export function createConsoleEventEmitter(): ConsoleEventEmitter {
  const listeners = new Map<
    ConsoleEventName,
    Set<(...args: unknown[]) => void>
  >();

  const getListeners = (type: ConsoleEventName) => {
    let eventListeners = listeners.get(type);

    if (!eventListeners) {
      eventListeners = new Set();
      listeners.set(type, eventListeners);
    }

    return eventListeners;
  };

  const on: ConsoleEventEmitter["on"] = (type, listener) => {
    const eventListeners = getListeners(type);
    eventListeners.add(listener as (...args: unknown[]) => void);

    return () => {
      eventListeners.delete(listener as (...args: unknown[]) => void);
    };
  };

  const off: ConsoleEventEmitter["off"] = (type, listener) => {
    listeners.get(type)?.delete(listener as (...args: unknown[]) => void);
  };

  const emit: ConsoleEventEmitter["emit"] = (type, ...args) => {
    const eventListeners = listeners.get(type);

    if (!eventListeners) {
      return;
    }

    for (const listener of Array.from(eventListeners)) {
      listener(...args);
    }
  };

  const removeAllListeners = (type?: ConsoleEventName) => {
    if (type) {
      listeners.delete(type);
      return;
    }

    listeners.clear();
  };

  return {
    on,
    off,
    emit,
    removeAllListeners,
  };
}
