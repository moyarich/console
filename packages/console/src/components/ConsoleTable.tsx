import { Copy } from "lucide-react";
import { useConsoleContextMenu } from "../hooks/useConsoleContextMenu";
import { ConsoleValue } from "./ConsoleValue";
import { normalizeConsoleTableData } from "../utils/consoleTableData";

export interface ConsoleTableProps { data: unknown; columns?: string[]; }
interface TableRow { index: string; value: Record<string, unknown>; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isObjectLike(value: unknown): value is object { return typeof value === "object" && value !== null; }
function toRows(data: unknown): TableRow[] {
  const normalized = normalizeConsoleTableData(data);
  if (Array.isArray(normalized)) return normalized.map((value, index) => ({ index: String(index), value: isRecord(value) ? value : { Value: value } }));
  if (isRecord(normalized)) return Object.entries(normalized).map(([index, value]) => ({ index, value: isRecord(value) ? value : { Value: value } }));
  return [{ index: "0", value: { Value: normalized } }];
}
function collectColumns(rows: TableRow[], requested?: string[]): string[] {
  if (requested?.length) return requested;
  const seen = new Set<string>();
  const columns: string[] = [];
  for (const row of rows) for (const key of Object.keys(row.value)) { if (seen.has(key)) continue; seen.add(key); columns.push(key); }
  return columns;
}
export function ConsoleTable({ data, columns }: ConsoleTableProps) {
  const { copyObject, openForValue } = useConsoleContextMenu();
  const rows = toRows(data);
  const tableColumns = collectColumns(rows, columns);
  const copyable = isObjectLike(data);
  return (
    <div className="console-table-shell" onContextMenu={copyable ? (event) => openForValue(event, data) : undefined}>
      {copyable && <div className="console-table-actions"><button type="button" className="console-table-copy-button" aria-label="Copy table data" title="Copy table data" onClick={(event) => { event.stopPropagation(); copyObject(data); }} onContextMenu={(event) => event.stopPropagation()}><Copy size={12} aria-hidden="true" /><span>Copy</span></button></div>}
      <div className="console-table-scroll"><table className="console-table"><thead><tr><th>(index)</th>{tableColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.index}><td className="console-table-index">{row.index}</td>{tableColumns.map((column) => <td key={column}>{Object.prototype.hasOwnProperty.call(row.value, column) ? <ConsoleValue value={row.value[column]} /> : <span className="console-undefined">undefined</span>}</td>)}</tr>)}</tbody></table></div>
    </div>
  );
}
