import { normalizeConsoleValue } from "./normalizeConsoleValue";

/**
 * Formats an inspectable object as readable JSON for clipboard operations.
 *
 * @param value Object to format.
 * @returns Pretty-printed JSON when possible, otherwise the object's string form.
 */
export function formatConsoleObjectForCopy(value: object): string {
  try {
    return JSON.stringify(normalizeConsoleValue(value), null, 2);
  } catch {
    return String(value);
  }
}
