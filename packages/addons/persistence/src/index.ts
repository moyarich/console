import {
  consoleServices,
  type ConsoleAddon,
  type ConsoleDataService,
  type ConsoleMessageData,
  type ConsoleStdoutEntry,
} from "@moyarich/console-core";

/** Adapters decide where and how records are stored. */
export interface ConsolePersistenceAdapter {
  write(records: readonly ConsolePersistenceRecord[]): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}

export type ConsolePersistenceRecord =
  | { kind: "console"; sequence: number; capturedAt: string; message: ConsoleMessageData }
  | { kind: "terminal"; sequence: number; capturedAt: string; entry: ConsoleStdoutEntry | string };

export interface ConsolePersistenceOptions {
  adapters: readonly ConsolePersistenceAdapter[];
  batchSize?: number;
  flushInterval?: number;
  maxQueueSize?: number;
  onError?: (error: unknown) => void;
}

export interface ConsolePersistence {
  append(input: { kind: "console"; message: ConsoleMessageData } | { kind: "terminal"; entry: ConsoleStdoutEntry | string }): void;
  flush(): Promise<void>;
  close(): Promise<void>;
  readonly pending: number;
}

export const CONSOLE_PERSISTENCE_ADDON_ID = "@moyarich/console-addon-persistence";

/** Headless engine usable without a mounted React console. */
export function createConsolePersistence(options: ConsolePersistenceOptions): ConsolePersistence {
  const adapters = [...options.adapters];
  const batchSize = Math.max(1, options.batchSize ?? 100);
  const maxQueueSize = Math.max(batchSize, options.maxQueueSize ?? 10_000);
  const interval = options.flushInterval ?? 1000;
  const queue: ConsolePersistenceRecord[] = [];
  let sequence = 0;
  let closing = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let current: Promise<void> = Promise.resolve();

  const report = (error: unknown) => { options.onError?.(error); };
  function flush(): Promise<void> {
    current = current.then(async () => {
      while (queue.length) {
        const batch = queue.slice(0, batchSize);
        try {
          await Promise.all(adapters.map((adapter) => adapter.write(batch)));
          queue.splice(0, batch.length);
        } catch (error) {
          report(error);
          throw error;
        }
      }
      await Promise.all(adapters.map((adapter) => adapter.flush?.()));
    });
    return current.catch((error) => {
      // Recover the serialized write chain for subsequent explicit retries.
      current = Promise.resolve();
      throw error;
    });
  }
  function append(input: { kind: "console"; message: ConsoleMessageData } | { kind: "terminal"; entry: ConsoleStdoutEntry | string }) {
    if (closing) throw new Error("Persistence is closed");
    if (queue.length >= maxQueueSize) throw new Error("Persistence queue capacity exceeded");
    const record = { ...input, sequence: ++sequence, capturedAt: new Date().toISOString() } as ConsolePersistenceRecord;
    queue.push(record);
    if (queue.length >= batchSize) void flush().catch(() => undefined);
  }
  if (interval > 0) timer = setInterval(() => { void flush().catch(() => undefined); }, interval);
  return {
    append, flush,
    get pending() { return queue.length; },
    async close() {
      if (closing) return;
      if (timer) clearInterval(timer);
      await flush();
      closing = true;
      await Promise.all(adapters.map((adapter) => adapter.close?.()));
    },
  };
}

export function createConsolePersistenceAddon(options: ConsolePersistenceOptions): ConsoleAddon & {
  persistence: ConsolePersistence;
} {
  const persistence = createConsolePersistence(options);
  return {
    id: CONSOLE_PERSISTENCE_ADDON_ID,
    persistence,
    activate(host) {
      const data: ConsoleDataService | undefined = host.services.get(consoleServices.data);
      if (!data) throw new Error("Persistence requires the Console data service");
      let previous: readonly unknown[] = [];
      let previousMode: string | undefined;
      const capture = () => {
        const snapshot = data.getSnapshot();
        const entries = snapshot.mode === "console" ? snapshot.all : snapshot.rawEntries;
        const samePrefix = snapshot.mode === previousMode &&
          previous.length <= entries.length &&
          previous.every((value, index) => value === entries[index]);
        // Initial history is imported once; on reset a new snapshot begins.
        const offset = samePrefix ? previous.length : 0;
        for (const entry of entries.slice(offset)) {
          if (snapshot.mode === "console") {
            persistence.append({ kind: "console", message: entry as ConsoleMessageData });
          } else {
            persistence.append({ kind: "terminal", entry: entry as ConsoleStdoutEntry | string });
          }
        }
        previous = entries.slice();
        previousMode = snapshot.mode;
      };
      capture();
      const subscription = data.subscribe(capture);
      return () => {
        subscription.dispose();
        void persistence.close().catch(options.onError ?? (() => undefined));
      };
    },
  };
}

/** Basic NDJSON serializer. Applications can redact records before writing. */
export function stringifyConsolePersistenceRecord(record: ConsolePersistenceRecord): string {
  return JSON.stringify(record) + "\n";
}
