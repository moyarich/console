import type { ConsoleValueRenderer } from "./types";

/**
 * Returns the type discriminator used by {@link ConsoleValueRenderer.type}.
 */
export function getConsoleValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";

  if (typeof value !== "object") {
    return typeof value;
  }

  return value.constructor?.name || "object";
}
