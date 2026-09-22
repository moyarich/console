/**
 * Converts a console value into a stable, JSON-compatible representation.
 *
 * BigInt, functions, symbols, undefined, dates, regular expressions, errors,
 * and circular references are converted to readable strings.
 *
 * @param value Value to normalize.
 * @param seen Object identities already visited while traversing the value.
 * @returns A JSON-compatible representation suitable for clipboard formatting.
 */
export function normalizeConsoleValue(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (typeof value === "bigint") {
    return `${value}n`;
  }

  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }

  if (typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "undefined") {
    return "[undefined]";
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof RegExp) {
    return String(value);
  }

  if (value instanceof Error) {
    return value.stack || value.message;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => normalizeConsoleValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeConsoleValue(item, seen),
    ]),
  );
}
