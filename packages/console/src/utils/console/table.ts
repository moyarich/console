import { normalizeConsoleTableData } from "../consoleTableData";

export interface ConsoleTableRow {
  index: string;
  value: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Normalizes supported table inputs into indexed row records. */
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

/** Preserves requested columns or derives first-seen columns from all rows. */
export function collectColumns(
  rows: readonly ConsoleTableRow[],
  requested?: readonly string[],
): string[] {
  if (requested?.length) {
    return [...requested];
  }

  const seen = new Set<string>();
  const columns: string[] = [];

  for (const row of rows) {
    for (const key of Object.keys(row.value)) {
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      columns.push(key);
    }
  }

  return columns;
}
