import { Copy } from "lucide-react";
import { useConsoleContextMenu } from "../hooks/useConsoleContextMenu";
import { ConsoleValue } from "./ConsoleValue";
import type { ConsoleValueRenderer } from "../types";
import type { ConsoleLinkProvider } from "../links/types";
import { collectColumns } from "../utils/table/collectColumns";
import { toRows } from "../utils/table/toRows";
import { isObjectLike } from "../utils/values/isObjectLike";

/** Props for rendering normalized `console.table()` output. */
export interface ConsoleTableProps {
  /** Original table input. */
  data: unknown;
  /** Optional explicit column order/filter. */
  columns?: string[];
  /** Custom renderers used for individual table cells. */
  valueRenderers?: readonly ConsoleValueRenderer[];
  /** Whether built-in HTTP/HTTPS detection is enabled. @default true */
  detectLinks?: boolean;
  /** Ordered application-specific link providers. */
  linkProviders?: readonly ConsoleLinkProvider[];
}
/**
 * Renders `console.table()` data with horizontal scrolling, value renderers,
 * and copy/context-menu support for object-like input.
 */
export function ConsoleTable({
  data,
  columns,
  valueRenderers,
  detectLinks = true,
  linkProviders,
}: ConsoleTableProps) {
  const { copyObject, openForValue } = useConsoleContextMenu();
  const rows = toRows(data);
  const tableColumns = collectColumns(rows, columns);
  const copyable = isObjectLike(data);
  return (
    <div
      className="console-table-shell"
      onContextMenu={
        copyable ? (event) => openForValue(event, data) : undefined
      }
    >
      {copyable && (
        <div className="console-table-actions">
          <button
            type="button"
            className="console-table-copy-button"
            aria-label="Copy table data"
            title="Copy table data"
            onClick={(event) => {
              event.stopPropagation();
              copyObject(data);
            }}
            onContextMenu={(event) => event.stopPropagation()}
          >
            <Copy size={12} aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
      )}
      <div className="console-table-scroll">
        <table className="console-table">
          <thead>
            <tr>
              <th>(index)</th>
              {tableColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.index}>
                <td className="console-table-index">{row.index}</td>
                {tableColumns.map((column) => (
                  <td key={column}>
                    {Object.prototype.hasOwnProperty.call(row.value, column) ? (
                      <ConsoleValue
                        value={row.value[column]}
                        renderers={valueRenderers}
                        detectLinks={detectLinks}
                        linkProviders={linkProviders}
                        linkContext={{ mode: "console" }}
                      />
                    ) : (
                      <span className="console-undefined">undefined</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
