import Anser from "anser";
import {
  consoleExtensionPoints,
  consoleServices,
  formatConsoleObjectForCopy,
  serializeConsoleValue,
  writeClipboardText,
  type ConsoleAddon,
  type ConsoleContextMenuAction,
  type ConsoleDataService,
  type ConsoleDataSnapshot,
  type ConsoleMessageData,
  type ConsolePanelAction,
  type ConsoleProcessViewEntry,
} from "@moyarich/console";

/** Stable package-qualified identity for the export addon. */
export const CONSOLE_EXPORT_ADDON_ID = "@moyarich/console-addon-export";

/** Stable marker written into structured export files. */
export const CONSOLE_EXPORT_TYPE = "MOYARICH_CONSOLE_EXPORT";

/** Version of the structured export envelope. */
export const CONSOLE_EXPORT_VERSION = 1 as const;

export type ConsoleExportScope = "all" | "visible";
export type ConsoleExportFormat = "text" | "json";

export interface ConsoleExportOptions {
  /** Output format. */
  format: ConsoleExportFormat;
  /** Logical data scope. @default "visible" */
  scope?: ConsoleExportScope;
}

export interface ConsoleExportDownloadOptions extends ConsoleExportOptions {
  /** Download filename without an inferred extension requirement. */
  fileName?: string;
}

export interface ConsoleExportActionsOptions {
  /** Add Copy as JSON to panel and console-surface context actions. @default true */
  copyJson?: boolean;
  /** Add Download text to the panel actions. @default true */
  downloadText?: boolean;
  /** Add Download JSON to the panel actions. @default true */
  downloadJson?: boolean;
  /** Scope used by contributed actions. @default "visible" */
  scope?: ConsoleExportScope;
}

export interface ConsoleExportAddonOptions {
  /** Optional action contribution configuration. */
  actions?: ConsoleExportActionsOptions;
  /** Base filename used by download actions. @default "console-export" */
  fileName?: string;
}

export interface ConsoleStructuredExportRecord {
  readonly kind: "console";
  readonly id?: string;
  readonly method: ConsoleMessageData["method"];
  readonly text: string;
  readonly args: readonly unknown[];
  readonly depth: number;
  readonly timestamp?: number;
  readonly time?: string;
  readonly source?: string;
  readonly options?: {
    readonly columns?: readonly string[];
    readonly expandLevel?: number;
    readonly showNonenumerable?: boolean;
  };
}

export interface ConsoleProcessExportRecord {
  readonly kind: "process";
  readonly id?: string;
  readonly stream?: string;
  readonly text: string;
  readonly structuredValue?: unknown;
  readonly metadata?: unknown;
}

export type ConsoleExportRecord =
  | ConsoleStructuredExportRecord
  | ConsoleProcessExportRecord;

export interface ConsoleExportEnvelope {
  readonly type: typeof CONSOLE_EXPORT_TYPE;
  readonly version: typeof CONSOLE_EXPORT_VERSION;
  readonly mode: ConsoleDataSnapshot["mode"];
  readonly scope: ConsoleExportScope;
  readonly count: number;
  readonly records: readonly ConsoleExportRecord[];
}

export interface ConsoleExportService {
  toText(scope?: ConsoleExportScope): string;
  toJson(scope?: ConsoleExportScope): string;
  copy(options?: Partial<ConsoleExportOptions>): Promise<void>;
  download(options?: Partial<ConsoleExportDownloadOptions>): void;
}

const ANSI_ESCAPE = String.fromCharCode(27);
const BELL = String.fromCharCode(7);
const OSC_PATTERN = new RegExp(
  `${ANSI_ESCAPE}\\][\\s\\S]*?(?:${BELL}|${ANSI_ESCAPE}\\\\)`,
  "g",
);
const CSI_PATTERN = new RegExp(`${ANSI_ESCAPE}\\[[0-?]*[ -/]*[@-~]`, "g");

function getScopedItems(
  snapshot: ConsoleDataSnapshot,
  scope: ConsoleExportScope,
) {
  return scope === "all" ? snapshot.all : snapshot.visible;
}

function indentMultiline(value: string, indentation: string): string {
  return value.replace(/\n/g, `\n${indentation}`);
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (value !== null && typeof value === "object") {
    return formatConsoleObjectForCopy(value);
  }

  try {
    return String(value);
  } catch {
    return "[Unserializable]";
  }
}

function formatStructuredMessageBody(message: ConsoleMessageData): string {
  return message.data.map(formatValue).join(" ").trimEnd();
}

function formatStructuredMessage(message: ConsoleMessageData): string {
  const indentation = "  ".repeat(Math.max(0, message.depth));
  const methodPrefix = message.method === "log" ? "" : `[${message.method}] `;
  const formattedData = message.data
    .map((value) => indentMultiline(formatValue(value), indentation))
    .join(" ");

  return `${indentation}${methodPrefix}${formattedData}`.trimEnd();
}

function createStructuredExportRecord(
  message: ConsoleMessageData,
): ConsoleStructuredExportRecord {
  const hasOptions =
    message.columns !== undefined ||
    message.expandLevel !== undefined ||
    message.showNonenumerable !== undefined;
  const time =
    message.timestamp !== undefined && Number.isFinite(message.timestamp)
      ? new Date(message.timestamp).toISOString()
      : undefined;

  return {
    kind: "console",
    ...(message.id !== undefined ? { id: message.id } : {}),
    method: message.method,
    text: formatStructuredMessageBody(message),
    args: message.data.map((value) => serializeConsoleValue(value)),
    depth: message.depth,
    ...(message.timestamp !== undefined
      ? { timestamp: message.timestamp }
      : {}),
    ...(time !== undefined ? { time } : {}),
    ...(message.source !== undefined ? { source: message.source } : {}),
    ...(hasOptions
      ? {
          options: {
            ...(message.columns !== undefined
              ? { columns: [...message.columns] }
              : {}),
            ...(message.expandLevel !== undefined
              ? { expandLevel: message.expandLevel }
              : {}),
            ...(message.showNonenumerable !== undefined
              ? { showNonenumerable: message.showNonenumerable }
              : {}),
          },
        }
      : {}),
  };
}

function stripProcessFormatting(value: string): string {
  return Anser.ansiToText(value.replace(OSC_PATTERN, "")).replace(
    CSI_PATTERN,
    "",
  );
}

function formatProcessEntry(entry: ConsoleProcessViewEntry): string {
  return stripProcessFormatting(entry.output.data);
}

/** Formats a logical console snapshot as deterministic plain text. */
export function formatConsoleExportText(
  snapshot: ConsoleDataSnapshot,
  scope: ConsoleExportScope = "visible",
): string {
  const items = getScopedItems(snapshot, scope);

  if (snapshot.mode === "console") {
    return (items as readonly ConsoleMessageData[])
      .map(formatStructuredMessage)
      .join("\n");
  }

  return (items as readonly ConsoleProcessViewEntry[])
    .map(formatProcessEntry)
    .join("\n");
}

function createProcessExportRecord(
  view: ConsoleProcessViewEntry,
): ConsoleProcessExportRecord {
  const { entry, output } = view;
  const hasMetadata = Object.keys(output.metadata).length > 0;

  return {
    kind: "process",
    ...(entry.id !== undefined ? { id: entry.id } : {}),
    ...(entry.stream !== undefined ? { stream: entry.stream } : {}),
    text: stripProcessFormatting(output.data),
    ...(output.structuredValue !== undefined
      ? { structuredValue: serializeConsoleValue(output.structuredValue) }
      : {}),
    ...(hasMetadata
      ? { metadata: serializeConsoleValue(output.metadata) }
      : {}),
  };
}

/** Creates the versioned structured export envelope. */
export function createConsoleExportEnvelope(
  snapshot: ConsoleDataSnapshot,
  scope: ConsoleExportScope = "visible",
): ConsoleExportEnvelope {
  const items = getScopedItems(snapshot, scope);

  const records =
    snapshot.mode === "console"
      ? (items as readonly ConsoleMessageData[]).map(
          createStructuredExportRecord,
        )
      : (items as readonly ConsoleProcessViewEntry[]).map(
          createProcessExportRecord,
        );

  return {
    type: CONSOLE_EXPORT_TYPE,
    version: CONSOLE_EXPORT_VERSION,
    mode: snapshot.mode,
    scope,
    count: records.length,
    records,
  };
}

/** Formats a logical console snapshot as the versioned JSON export format. */
export function formatConsoleExportJson(
  snapshot: ConsoleDataSnapshot,
  scope: ConsoleExportScope = "visible",
): string {
  return JSON.stringify(createConsoleExportEnvelope(snapshot, scope), null, 2);
}

/** Formats a logical console snapshot without requiring React or the DOM. */
export function formatConsoleExport(
  snapshot: ConsoleDataSnapshot,
  { format, scope = "visible" }: ConsoleExportOptions,
): string {
  return format === "json"
    ? formatConsoleExportJson(snapshot, scope)
    : formatConsoleExportText(snapshot, scope);
}

/** Copies formatted export data using the existing core clipboard helper. */
export async function copyConsoleExport(
  snapshot: ConsoleDataSnapshot,
  { format = "text", scope = "visible" }: Partial<ConsoleExportOptions> = {},
): Promise<void> {
  await writeClipboardText(formatConsoleExport(snapshot, { format, scope }));
}

/** Downloads formatted export data in browser environments. */
export function downloadConsoleExport(
  snapshot: ConsoleDataSnapshot,
  {
    format = "text",
    scope = "visible",
    fileName = "console-export",
  }: Partial<ConsoleExportDownloadOptions> = {},
): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Console export download requires a browser environment.");
  }

  const value = formatConsoleExport(snapshot, { format, scope });
  const extension = format === "json" ? "json" : "txt";
  const mimeType =
    format === "json"
      ? "application/json;charset=utf-8"
      : "text/plain;charset=utf-8";
  const resolvedFileName = fileName.endsWith(`.${extension}`)
    ? fileName
    : `${fileName}.${extension}`;
  const url = URL.createObjectURL(new Blob([value], { type: mimeType }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = resolvedFileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Creates a programmatic export service backed by the core logical-data service. */
export function createConsoleExportService(
  data: ConsoleDataService,
  defaultFileName = "console-export",
): ConsoleExportService {
  return {
    toText(scope = "visible") {
      return formatConsoleExportText(data.getSnapshot(), scope);
    },

    toJson(scope = "visible") {
      return formatConsoleExportJson(data.getSnapshot(), scope);
    },

    async copy({ format = "text", scope = "visible" } = {}) {
      await copyConsoleExport(data.getSnapshot(), { format, scope });
    },

    download({
      format = "text",
      scope = "visible",
      fileName = defaultFileName,
    } = {}) {
      downloadConsoleExport(data.getSnapshot(), {
        format,
        scope,
        fileName,
      });
    },
  };
}

const actionIds = {
  copyJson: `${CONSOLE_EXPORT_ADDON_ID}:copy-json`,
  downloadText: `${CONSOLE_EXPORT_ADDON_ID}:download-text`,
  downloadJson: `${CONSOLE_EXPORT_ADDON_ID}:download-json`,
} as const;

function registerPanelAction(
  host: Parameters<ConsoleAddon["activate"]>[0],
  action: ConsolePanelAction,
): void {
  host.extensions.register(consoleExtensionPoints.panelAction, action, {
    id: action.id,
  });
}

function registerContextMenuAction(
  host: Parameters<ConsoleAddon["activate"]>[0],
  action: ConsoleContextMenuAction,
): void {
  host.extensions.register(consoleExtensionPoints.contextMenuAction, action, {
    id: action.id,
  });
}

/**
 * Creates the first-party data-level output export addon.
 *
 * Existing core Copy output, object/table copy, serializers, process-output
 * handling, and renderers remain owned by @moyarich/console.
 */
export function createConsoleExportAddon(
  options: ConsoleExportAddonOptions = {},
): ConsoleAddon {
  const {
    actions: {
      copyJson = true,
      downloadText = true,
      downloadJson = true,
      scope = "visible",
    } = {},
    fileName = "console-export",
  } = options;

  return {
    id: CONSOLE_EXPORT_ADDON_ID,

    activate(host) {
      const data = host.services.require(consoleServices.data);
      const service = createConsoleExportService(data, fileName);
      const disabled = (context: { hasMessages: boolean }) =>
        !context.hasMessages;

      if (copyJson) {
        const action: ConsolePanelAction = {
          id: actionIds.copyJson,
          label: "Copy as JSON",
          disabled,
          onSelect: () => service.copy({ format: "json", scope }),
        };

        registerPanelAction(host, action);
        registerContextMenuAction(host, {
          id: actionIds.copyJson,
          label: "Copy as JSON",
          visible: (context) => context.kind === "console",
          disabled,
          onSelect: () => service.copy({ format: "json", scope }),
        });
      }

      if (downloadText) {
        registerPanelAction(host, {
          id: actionIds.downloadText,
          label: "Download text",
          disabled,
          onSelect: () => service.download({ format: "text", scope, fileName }),
        });
      }

      if (downloadJson) {
        registerPanelAction(host, {
          id: actionIds.downloadJson,
          label: "Download JSON",
          disabled,
          onSelect: () => service.download({ format: "json", scope, fileName }),
        });
      }
    },
  };
}
