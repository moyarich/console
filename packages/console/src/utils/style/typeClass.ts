/**
 * Maps a primitive console value to its renderer CSS class.
 *
 * @param value Console value.
 * @returns Console CSS class for known primitive types, or an empty string.
 */
export function typeClass(value: unknown): string {
  if (value === null) {
    return "console-null";
  }

  if (typeof value === "string") {
    return "console-string";
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return "console-number";
  }

  if (typeof value === "boolean") {
    return "console-boolean";
  }

  if (typeof value === "undefined") {
    return "console-undefined";
  }

  if (typeof value === "symbol") {
    return "console-symbol";
  }

  return "";
}
