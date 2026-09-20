import type { ConsoleEventSink } from "../types";

export interface ConsoleEventChannel {
  emit: ConsoleEventSink;
  subscribe(listener: ConsoleEventSink): () => void;
  clear(): void;
}

export function createConsoleEventChannel(): ConsoleEventChannel {
  const listeners = new Set<ConsoleEventSink>();

  const emit: ConsoleEventSink = (event) => {
    for (const listener of Array.from(listeners)) {
      listener(event);
    }
  };

  return {
    emit,

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    clear() {
      listeners.clear();
    },
  };
}
