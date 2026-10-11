/** Built-in strategy for displaying structured message values. */
export type ConsoleValueDisplay = "structured" | "string";

/** Produces a safe, readable representation without mutating the source value. */
export function stringifyConsoleValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  if (
    typeof value === "bigint" ||
    typeof value === "symbol" ||
    typeof value === "function"
  )
    return String(value);
  if (typeof value !== "object") return String(value);

  const seen = new WeakSet<object>();
  try {
    const json = JSON.stringify(value, (_key, current: unknown) => {
      if (
        typeof current === "bigint" ||
        typeof current === "symbol" ||
        typeof current === "function"
      )
        return String(current);
      if (current && typeof current === "object") {
        if (seen.has(current)) return "[Circular]";
        seen.add(current);
      }
      return current;
    });
    return json ?? String(value);
  } catch {
    try {
      return Object.prototype.toString.call(value);
    } catch {
      return "[Unserializable]";
    }
  }
}
