/**
 * Returns whether a value is a non-array object record.
 *
 * @param value Candidate value.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
