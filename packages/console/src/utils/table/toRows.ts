import { isRecord } from "../values/isRecord";
import { normalizeConsoleTableData } from "./normalizeConsoleTableData";
import type { ConsoleTableRow } from "./types";

/**
 * Converts supported console.table input into normalized indexed rows.
 *
 * @param data Original console.table input.
 * @returns Rows ready for table column collection and rendering.
 */
export function toRows(data: unknown): ConsoleTableRow[] {
  const normalized = normalizeConsoleTableData(data);

  if (Array.isArray(normalized)) {
    return normalized.map((value, index) => ({
      index: String(index),
      value: isRecord(value) ? value : { Value: value },
    }));
  }

  if (isRecord(normalized)) {
    return Object.entries(normalized).map(([index, value]) => ({
      index,
      value: isRecord(value) ? value : { Value: value },
    }));
  }

  return [{ index: "0", value: { Value: normalized } }];
}
