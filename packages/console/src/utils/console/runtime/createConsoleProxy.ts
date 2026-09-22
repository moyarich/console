import {
  CAPTURED_CONSOLE_METHODS,
  getConsoleMessageMethod,
  isDirectConsoleMethod,
} from "../../../consoleMethods";
import type {
  ConsoleMessageData,
  ConsoleMethod,
  DirOptions,
} from "../../../types";
import type { ConsoleEventEmitter } from "../../events/createConsoleEventEmitter";

/** Configuration for {@link createConsoleProxy}. */
export interface CreateConsoleProxyOptions {
  /** Optional event bus that receives emitted messages and clear events. */
  events?: ConsoleEventEmitter;
  /** Source metadata attached to emitted messages. */
  source?: string;
  /** Clock used for message timestamps. Defaults to `Date.now`. */
  now?: () => number;
  /** Monotonic clock used by console timers when available. */
  timerNow?: () => number;
}

const defaultTimerNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

/**
 * Creates a Console-compatible proxy that emits structured console events.
 *
 * Stateful methods such as groups, counters, timers, `dir`, and `table` are
 * normalized into {@link ConsoleMessageData}. Unknown method names degrade to
 * log messages so sandboxed runtimes can call non-standard console methods
 * without throwing.
 */
export function createConsoleProxy({
  events,
  source,
  now = () => Date.now(),
  timerNow = defaultTimerNow,
}: CreateConsoleProxyOptions = {}): Console {
  const counts = new Map<string, number>();
  const timers = new Map<string, number>();
  let depth = 0;

  const emitMessage = (
    method: ConsoleMethod,
    data: unknown[],
    extra: Partial<ConsoleMessageData> = {},
  ) => {
    const message: ConsoleMessageData = {
      method,
      data,
      depth,
      timestamp: now(),
      source,
      ...extra,
    };

    events?.emit("message", message);
  };

  const clearMessages = () => {
    events?.emit("clear");
  };

  const getElapsedTime = (label: string) => {
    const startedAt = timers.get(label);
    return startedAt === undefined ? null : timerNow() - startedAt;
  };

  const getDirExpandLevel = (requestedDepth?: number | null) =>
    requestedDepth === null
      ? 100
      : typeof requestedDepth === "number"
        ? Math.max(0, requestedDepth)
        : 1;

  const directMessageMethods = Object.fromEntries(
    CAPTURED_CONSOLE_METHODS.filter(isDirectConsoleMethod).map((name) => [
      name,
      (...data: unknown[]) => {
        const method = getConsoleMessageMethod(name);

        if (method) {
          emitMessage(method, data);
        }
      },
    ]),
  );

  const consoleMethods = {
    ...directMessageMethods,

    assert(condition?: boolean, ...data: unknown[]) {
      if (!condition) {
        emitMessage("assert", data.length ? data : ["Assertion failed"]);
      }
    },

    clear: clearMessages,

    count(label = "default") {
      const count = (counts.get(label) ?? 0) + 1;
      counts.set(label, count);
      emitMessage("count", [`${label}: ${count}`]);
    },

    countReset(label = "default") {
      counts.set(label, 0);
    },

    dir(value: unknown, options?: DirOptions) {
      emitMessage("dir", [value], {
        expandLevel: getDirExpandLevel(options?.depth),
        showNonenumerable: options?.showHidden === true,
      });
    },

    dirxml(...data: unknown[]) {
      emitMessage("dir", data, { expandLevel: 1 });
    },

    group(...data: unknown[]) {
      if (data.length) {
        emitMessage("group", data);
      }

      depth += 1;
    },

    groupCollapsed(...data: unknown[]) {
      if (data.length) {
        emitMessage("groupCollapsed", data);
      }

      depth += 1;
    },

    groupEnd() {
      depth = Math.max(0, depth - 1);
    },

    table(data: unknown, columns?: string[]) {
      emitMessage("table", [data], {
        columns: columns?.length ? columns : undefined,
      });
    },

    time(label = "default") {
      timers.set(label, timerNow());
    },

    timeEnd(label = "default") {
      const duration = getElapsedTime(label);

      if (duration === null) {
        emitMessage("warn", [`Timer ${label} does not exist`]);
        return;
      }

      emitMessage("timeEnd", [`${label}: ${duration.toFixed(2)} ms`]);

      timers.delete(label);
    },

    timeLog(label = "default", ...data: unknown[]) {
      const duration = getElapsedTime(label);

      if (duration === null) {
        emitMessage("warn", [`Timer ${label} does not exist`]);
        return;
      }

      emitMessage("log", [`${label}: ${duration.toFixed(2)} ms`, ...data]);
    },

    timeStamp() {},

    trace(...data: unknown[]) {
      const stack = new Error().stack?.split("\n").slice(2).join("\n");
      emitMessage("trace", stack ? [...data, stack] : data);
    },
  };

  return new Proxy(consoleMethods, {
    get(targetObject, property, receiver) {
      if (Reflect.has(targetObject, property)) {
        return Reflect.get(targetObject, property, receiver);
      }

      if (typeof property !== "string") {
        return undefined;
      }

      return (...data: unknown[]) =>
        emitMessage("log", [`${property}:`, ...data]);
    },
  }) as Console;
}
