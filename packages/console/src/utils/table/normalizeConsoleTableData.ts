import { isObjectLike } from "../values/isObjectLike";

/**
 * Normalizes console.table input so scalar entries are wrapped in a Value column.
 *
 * Row-like object values keep their original shape. Arrays count as object-like
 * rows here to preserve the package's existing console.table behavior.
 *
 * @param data Original console.table input.
 * @returns Normalized table-compatible data.
 */
export function normalizeConsoleTableData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.length > 0 && data.every(isObjectLike)
      ? data
      : data.map((value) => ({ Value: value }));
  }

  if (isObjectLike(data)) {
    const entries = Object.entries(data);
    const values = entries.map(([, value]) => value);

    if (values.length > 0 && values.every(isObjectLike)) {
      return data;
    }

    return Object.fromEntries(
      entries.map(([key, value]) => [key, { Value: value }]),
    );
  }

  return data;
}
