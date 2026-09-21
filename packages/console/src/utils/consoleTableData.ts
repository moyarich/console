function isTableRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function allRowsAreRecords(values: unknown[]): boolean {
  return values.length > 0 && values.every(isTableRecord);
}
export function normalizeConsoleTableData(data: unknown): unknown {
  if (Array.isArray(data))
    return allRowsAreRecords(data)
      ? data
      : data.map((value) => ({ Value: value }));
  if (isTableRecord(data)) {
    const entries = Object.entries(data);
    const values = entries.map(([, value]) => value);
    if (allRowsAreRecords(values)) return data;
    return Object.fromEntries(
      entries.map(([key, value]) => [key, { Value: value }]),
    );
  }
  return data;
}
