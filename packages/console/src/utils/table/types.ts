/** Normalized row used by the console.table renderer. */
export interface ConsoleTableRow {
  /** Display index for the row. */
  index: string;
  /** Normalized key/value cells for the row. */
  value: Record<string, unknown>;
}
