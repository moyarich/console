import { isTableRecord } from "./isTableRecord";

/**
 * Returns whether a non-empty collection contains only console.table records.
 *
 * @param values Candidate row values.
 */
export function allRowsAreRecords(values: readonly unknown[]): boolean {
  return values.length > 0 && values.every(isTableRecord);
}
