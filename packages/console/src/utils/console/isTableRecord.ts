/**
 * Returns whether a value can act as a console.table record.
 *
 * Arrays are intentionally considered records here to preserve existing
 * console.table normalization semantics.
 *
 * @param value Candidate table value.
 */
export function isTableRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
