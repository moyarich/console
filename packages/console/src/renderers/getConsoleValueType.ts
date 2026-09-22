/**
 * Returns the type discriminator used by custom value renderer `type` matching.
 */
export function getConsoleValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";

  if (typeof value !== "object") {
    return typeof value;
  }

  return value.constructor?.name || "object";
}
