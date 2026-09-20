import type { ConsoleEvent, ConsoleEventSink, ConsoleMessageData, ConsoleMethod, DirOptions } from "./types";

export interface CreateConsoleProxyOptions { messages?: ConsoleMessageData[]; onEvent?: ConsoleEventSink; source?: string; now?: () => number; }
function normalizeOptions(target: ConsoleMessageData[] | CreateConsoleProxyOptions): CreateConsoleProxyOptions { return Array.isArray(target) ? { messages: target } : target; }

export function createConsoleProxy(target: ConsoleMessageData[] | CreateConsoleProxyOptions = {}): Console {
  const { messages, onEvent, source, now = () => Date.now() } = normalizeOptions(target);
  const counts = new Map<string, number>();
  const timers = new Map<string, number>();
  let depth = 0;
  const emitEvent = (event: ConsoleEvent) => { if (event.type === "clear") { if (messages) messages.length = 0; onEvent?.(event); return; } messages?.push(event.message); onEvent?.(event); };
  const emit = (method: ConsoleMethod, data: unknown[], extra: Partial<ConsoleMessageData> = {}) => emitEvent({ type: "message", message: { method, data, depth, timestamp: now(), source, ...extra } });
  const getElapsedTime = (label: string) => { const startedAt = timers.get(label); return startedAt === undefined ? null : performance.now() - startedAt; };
  const getDirExpandLevel = (requestedDepth?: number | null) => requestedDepth === null ? 100 : typeof requestedDepth === "number" ? Math.max(0, requestedDepth) : 1;
  const messageMethods = { debug: "debug", error: "error", info: "info", log: "log", warn: "warn" } satisfies Record<string, ConsoleMethod>;
  const consoleMethods = {
    ...Object.fromEntries(Object.entries(messageMethods).map(([name, method]) => [name, (...data: unknown[]) => emit(method, data)])),
    assert(condition?: boolean, ...data: unknown[]) { if (!condition) emit("assert", data.length ? data : ["Assertion failed"]); },
    clear() { emitEvent({ type: "clear" }); },
    count(label = "default") { const count = (counts.get(label) ?? 0) + 1; counts.set(label, count); emit("count", [`${label}: ${count}`]); },
    countReset(label = "default") { counts.set(label, 0); },
    dir(value: unknown, options?: DirOptions) { emit("dir", [value], { expandLevel: getDirExpandLevel(options?.depth), showNonenumerable: options?.showHidden === true }); },
    dirxml(...data: unknown[]) { emit("dir", data, { expandLevel: 1 }); },
    group(...data: unknown[]) { if (data.length) emit("group", data); depth += 1; },
    groupCollapsed(...data: unknown[]) { if (data.length) emit("groupCollapsed", data); depth += 1; },
    groupEnd() { depth = Math.max(0, depth - 1); },
    table(data: unknown, columns?: string[]) { emit("table", [data], { columns: columns?.length ? columns : undefined }); },
    time(label = "default") { timers.set(label, performance.now()); },
    timeEnd(label = "default") { const duration = getElapsedTime(label); if (duration === null) { emit("warn", [`Timer ${label} does not exist`]); return; } emit("timeEnd", [`${label}: ${duration.toFixed(2)} ms`]); timers.delete(label); },
    timeLog(label = "default", ...data: unknown[]) { const duration = getElapsedTime(label); if (duration === null) { emit("warn", [`Timer ${label} does not exist`]); return; } emit("log", [`${label}: ${duration.toFixed(2)} ms`, ...data]); },
    timeStamp() {},
    trace(...data: unknown[]) { const stack = new Error().stack?.split("\n").slice(2).join("\n"); emit("trace", stack ? [...data, stack] : data); },
  };
  return new Proxy(consoleMethods, { get(targetObject, property, receiver) { if (Reflect.has(targetObject, property)) return Reflect.get(targetObject, property, receiver); if (typeof property !== "string") return undefined; return (...data: unknown[]) => emit("log", [`${property}:`, ...data]); } }) as Console;
}
