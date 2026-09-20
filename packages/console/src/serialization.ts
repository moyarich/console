import type { ConsoleEvent, ConsoleMessageData } from "./types";

export interface SerializeConsoleValueOptions { maxDepth?: number; maxEntries?: number; }
function normalizeValue(value: unknown, seen: WeakSet<object>, depth: number, maxDepth: number, maxEntries: number): unknown {
  if (typeof value === "undefined") return "[undefined]";
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "symbol") return String(value);
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (seen.has(value)) return "[Circular]";
  if (depth >= maxDepth) return `[${value.constructor?.name || "Object"}]`;
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const items: unknown[] = value.slice(0, maxEntries).map((item) => normalizeValue(item, seen, depth + 1, maxDepth, maxEntries));
      if (value.length > maxEntries) items.push(`[+${value.length - maxEntries} more]`);
      return items;
    }
    const entries = Object.entries(value).slice(0, maxEntries);
    const result: Record<string, unknown> = Object.fromEntries(entries.map(([key, item]) => [key, normalizeValue(item, seen, depth + 1, maxDepth, maxEntries)]));
    const total = Object.keys(value).length;
    if (total > maxEntries) result["…"] = `[+${total - maxEntries} more]`;
    return result;
  } catch {
    try { return String(value); } catch { return "[Unserializable]"; }
  } finally {
    seen.delete(value);
  }
}
export function serializeConsoleValue(value: unknown, { maxDepth = 8, maxEntries = 100 }: SerializeConsoleValueOptions = {}): unknown { return normalizeValue(value, new WeakSet<object>(), 0, maxDepth, maxEntries); }
export function serializeConsoleMessage(message: ConsoleMessageData): ConsoleMessageData { return { ...message, data: message.data.map((value) => serializeConsoleValue(value)) }; }
export function serializeConsoleEvent(event: ConsoleEvent): ConsoleEvent { return event.type === "message" ? { type: "message", message: serializeConsoleMessage(event.message) } : event; }
