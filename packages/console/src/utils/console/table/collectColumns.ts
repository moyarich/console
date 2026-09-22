import type { ConsoleTableRow } from "./types";

/**
 * Preserves requested console.table columns or derives first-seen columns.
 *
 * @param rows Normalized table rows.
 * @param requested Optional explicit column order/filter.
 * @returns Ordered column names.
 */
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
