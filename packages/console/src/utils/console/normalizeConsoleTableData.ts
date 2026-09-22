import { allRowsAreRecords } from "./allRowsAreRecords";
import { isTableRecord } from "./isTableRecord";

/**
 * Normalizes console.table input so scalar entries are wrapped in a Value column.
 *
 * Row-like records keep their original shape.
 *
 * @param data Original console.table input.
 * @returns Normalized table-compatible data.
 */
export function normalizeConsoleTableData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return allRowsAreRecords(data)
      ? data
      : data.map((value) => ({ Value: value }));
  }

  if (isTableRecord(data)) {
    const entries = Object.entries(data);
    const values = entries.map(([, value]) => value);

    if (allRowsAreRecords(values)) {
      return data;
    }

    return Object.fromEntries(
      entries.map(([key, value]) => [key, { Value: value }]),
    );
  }

  return data;
}
