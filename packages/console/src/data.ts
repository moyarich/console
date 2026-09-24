import type { ConsoleDisposable } from "./addons";
import type {
  ConsoleProcessControlEvent,
  ConsoleResolvedProcessOutputEntry,
  ConsoleStdoutEntry,
} from "./processOutput";
import type { ConsoleMessageData, ConsoleMode } from "./types";

/** One resolved logical process-output entry shared by rendering and addons. */
export type ConsoleProcessViewEntry = ConsoleResolvedProcessOutputEntry;

/** Read-only structured-console data exposed to addons. */
export interface ConsoleStructuredDataSnapshot {
  readonly mode: "console";
  /** All retained logical messages owned by the console. */
  readonly all: readonly ConsoleMessageData[];
  /** Current logical view after host filtering/view rules. */
  readonly visible: readonly ConsoleMessageData[];
}

/** Read-only ANSI/process-output data exposed to addons. */
export interface ConsoleProcessDataSnapshot {
  readonly mode: "ansi";
  /** Original process-output chunks supplied to the console. */
  readonly rawEntries: readonly (ConsoleStdoutEntry | string)[];
  /** All retained resolved logical process-output entries. */
  readonly all: readonly ConsoleProcessViewEntry[];
  /** Current logical process-output view. */
  readonly visible: readonly ConsoleProcessViewEntry[];
  /** Semantic process-control events extracted before line normalization. */
  readonly controlEvents: readonly ConsoleProcessControlEvent[];
}

/** Current logical console data exposed through the addon service registry. */
export type ConsoleDataSnapshot =
  ConsoleStructuredDataSnapshot | ConsoleProcessDataSnapshot;

/**
 * Read-only logical data service.
 *
 * Logical visibility is independent from DOM mounting, scrolling, value
 * expansion, and custom renderer markup.
 */
export interface ConsoleDataService {
  getSnapshot(): ConsoleDataSnapshot;
  subscribe(listener: () => void): ConsoleDisposable;
}

/** Internal mutable controller owned by the React console host. */
export interface ConsoleDataController extends ConsoleDataService {
  setSnapshot(snapshot: ConsoleDataSnapshot): void;
}

const EMPTY_MESSAGES: readonly ConsoleMessageData[] = [];
const EMPTY_PROCESS_ENTRIES: readonly ConsoleProcessViewEntry[] = [];
const EMPTY_RAW_ENTRIES: readonly (ConsoleStdoutEntry | string)[] = [];

function createEmptySnapshot(mode: ConsoleMode): ConsoleDataSnapshot {
  return mode === "ansi"
    ? {
        mode: "ansi",
        rawEntries: EMPTY_RAW_ENTRIES,
        all: EMPTY_PROCESS_ENTRIES,
        visible: EMPTY_PROCESS_ENTRIES,
        controlEvents: [],
      }
    : {
        mode: "console",
        all: EMPTY_MESSAGES,
        visible: EMPTY_MESSAGES,
      };
}

/** Creates the logical-data controller used by the React console host. */
export function createConsoleDataController(
  mode: ConsoleMode,
): ConsoleDataController {
  let snapshot = createEmptySnapshot(mode);
  const listeners = new Set<() => void>();

  return {
    getSnapshot() {
      return snapshot;
    },

    setSnapshot(nextSnapshot) {
      if (snapshot === nextSnapshot) return;
      snapshot = nextSnapshot;

      for (const listener of listeners) {
        try {
          listener();
        } catch {
          // Data observers must not break console rendering.
        }
      }
    },

    subscribe(listener) {
      listeners.add(listener);

      return {
        dispose() {
          listeners.delete(listener);
        },
      };
    },
  };
}
