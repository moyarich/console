import {
  consoleExtensionPoints,
  consoleServices,
  serializeConsoleValue,
  writeClipboardText,
  type ConsoleAddon,
  type ConsoleContextMenuAction,
  type ConsoleDataService,
  type ConsoleDataSnapshot,
  type ConsoleMessageData,
  type ConsolePanelAction,
  type ConsoleProcessViewEntry,
  type ConsoleStdoutEntry,
} from "@moyarich/console";

/** Stable package-qualified identity for the diagnostics addon. */
export const CONSOLE_DIAGNOSTICS_ADDON_ID =
  "@moyarich/console-addon-diagnostics";

/** Stable marker written into diagnostics reports. */
export const CONSOLE_DIAGNOSTICS_TYPE = "MOYARICH_CONSOLE_DIAGNOSTICS";

/** Version of the diagnostics report contract. */
export const CONSOLE_DIAGNOSTICS_VERSION = 1 as const;

export interface ConsoleDiagnosticsMessageRecord {
  readonly kind: "console";
  readonly id?: string;
  readonly method: ConsoleMessageData["method"];
  readonly data: readonly unknown[];
  readonly depth: number;
  readonly timestamp?: number;
  readonly source?: string;
  readonly options?: {
    readonly columns?: readonly string[];
    readonly expandLevel?: number;
    readonly showNonenumerable?: boolean;
  };
}

export type ConsoleDiagnosticsRawEntry =
  | {
      readonly kind: "string";
      readonly data: string;
    }
  | {
      readonly kind: "entry";
      readonly id?: string;
      readonly stream?: string;
      readonly data: string;
      readonly metadata?: unknown;
    };

export interface ConsoleDiagnosticsResolvedProcessRecord {
  readonly kind: "process";
  readonly id?: string;
  readonly stream?: string;
  /** Logical line after core CR/newline normalization, before processors. */
  readonly normalizedData: string;
  /** Data after process-output processors have run. */
  readonly resolvedData: string;
  readonly structuredValue?: unknown;
  readonly metadata?: unknown;
}

export interface ConsoleStructuredDiagnosticsReport {
  readonly type: typeof CONSOLE_DIAGNOSTICS_TYPE;
  readonly version: typeof CONSOLE_DIAGNOSTICS_VERSION;
  readonly mode: "console";
  readonly counts: {
    readonly all: number;
    readonly visible: number;
  };
  readonly all: readonly ConsoleDiagnosticsMessageRecord[];
  readonly visible: readonly ConsoleDiagnosticsMessageRecord[];
}

export interface ConsoleProcessDiagnosticsReport {
  readonly type: typeof CONSOLE_DIAGNOSTICS_TYPE;
  readonly version: typeof CONSOLE_DIAGNOSTICS_VERSION;
  readonly mode: "ansi";
  readonly counts: {
    readonly raw: number;
    readonly all: number;
    readonly visible: number;
  };
  readonly rawEntries: readonly ConsoleDiagnosticsRawEntry[];
  readonly all: readonly ConsoleDiagnosticsResolvedProcessRecord[];
  readonly visible: readonly ConsoleDiagnosticsResolvedProcessRecord[];
}

export type ConsoleDiagnosticsReport =
  ConsoleStructuredDiagnosticsReport | ConsoleProcessDiagnosticsReport;

export interface ConsoleDiagnosticsDownloadOptions {
  /** Download filename. @default "console-diagnostics.json" */
  fileName?: string;
}

export interface ConsoleDiagnosticsActionsOptions {
  /** Add Copy diagnostics JSON to panel/context actions. @default true */
  copyJson?: boolean;
  /** Add Download diagnostics JSON to panel actions. @default true */
  downloadJson?: boolean;
}

export interface ConsoleDiagnosticsAddonOptions {
  actions?: ConsoleDiagnosticsActionsOptions;
  /** Base filename used by download actions. @default "console-diagnostics" */
  fileName?: string;
}

export interface ConsoleDiagnosticsService {
  getReport(): ConsoleDiagnosticsReport;
  toJson(): string;
  copyJson(): Promise<void>;
  downloadJson(options?: ConsoleDiagnosticsDownloadOptions): void;
}

function createMessageRecord(
  message: ConsoleMessageData,
): ConsoleDiagnosticsMessageRecord {
  const hasOptions =
    message.columns !== undefined ||
    message.expandLevel !== undefined ||
    message.showNonenumerable !== undefined;

  return {
    kind: "console",
    ...(message.id !== undefined ? { id: message.id } : {}),
    method: message.method,
    data: message.data.map((value) => serializeConsoleValue(value)),
    depth: message.depth,
    ...(message.timestamp !== undefined
      ? { timestamp: message.timestamp }
      : {}),
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

function createRawEntry(
  entry: ConsoleStdoutEntry | string,
): ConsoleDiagnosticsRawEntry {
  if (typeof entry === "string") {
    return {
      kind: "string",
      data: entry,
    };
  }

  return {
    kind: "entry",
    ...(entry.id !== undefined ? { id: entry.id } : {}),
    ...(entry.stream !== undefined ? { stream: entry.stream } : {}),
    data: entry.data,
    ...(entry.metadata !== undefined
      ? { metadata: serializeConsoleValue(entry.metadata) }
      : {}),
  };
}

function createResolvedProcessRecord(
  view: ConsoleProcessViewEntry,
): ConsoleDiagnosticsResolvedProcessRecord {
  const { entry, output } = view;
  const hasMetadata = Object.keys(output.metadata).length > 0;

  return {
    kind: "process",
    ...(entry.id !== undefined ? { id: entry.id } : {}),
    ...(entry.stream !== undefined ? { stream: entry.stream } : {}),
    normalizedData: entry.data,
    resolvedData: output.data,
    ...(output.structuredValue !== undefined
      ? { structuredValue: serializeConsoleValue(output.structuredValue) }
      : {}),
    ...(hasMetadata
      ? { metadata: serializeConsoleValue(output.metadata) }
      : {}),
  };
}

/** Creates a diagnostics report from the current logical data snapshot. */
export function createConsoleDiagnosticsReport(
  snapshot: ConsoleDataSnapshot,
): ConsoleDiagnosticsReport {
  if (snapshot.mode === "console") {
    return {
      type: CONSOLE_DIAGNOSTICS_TYPE,
      version: CONSOLE_DIAGNOSTICS_VERSION,
      mode: "console",
      counts: {
        all: snapshot.all.length,
        visible: snapshot.visible.length,
      },
      all: snapshot.all.map(createMessageRecord),
      visible: snapshot.visible.map(createMessageRecord),
    };
  }

  return {
    type: CONSOLE_DIAGNOSTICS_TYPE,
    version: CONSOLE_DIAGNOSTICS_VERSION,
    mode: "ansi",
    counts: {
      raw: snapshot.rawEntries.length,
      all: snapshot.all.length,
      visible: snapshot.visible.length,
    },
    rawEntries: snapshot.rawEntries.map(createRawEntry),
    all: snapshot.all.map(createResolvedProcessRecord),
    visible: snapshot.visible.map(createResolvedProcessRecord),
  };
}

/** Formats a diagnostics report as stable, readable JSON. */
export function formatConsoleDiagnosticsJson(
  snapshot: ConsoleDataSnapshot,
): string {
  return JSON.stringify(createConsoleDiagnosticsReport(snapshot), null, 2);
}

/** Copies a diagnostics report as JSON. */
export async function copyConsoleDiagnostics(
  snapshot: ConsoleDataSnapshot,
): Promise<void> {
  await writeClipboardText(formatConsoleDiagnosticsJson(snapshot));
}

/** Downloads a diagnostics report as JSON in browser environments. */
export function downloadConsoleDiagnostics(
  snapshot: ConsoleDataSnapshot,
  {
    fileName = "console-diagnostics.json",
  }: ConsoleDiagnosticsDownloadOptions = {},
): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error(
      "Console diagnostics download requires a browser environment.",
    );
  }

  const resolvedFileName = fileName.endsWith(".json")
    ? fileName
    : `${fileName}.json`;
  const url = URL.createObjectURL(
    new Blob([formatConsoleDiagnosticsJson(snapshot)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = resolvedFileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Creates a programmatic diagnostics service backed by consoleServices.data. */
export function createConsoleDiagnosticsService(
  data: ConsoleDataService,
  defaultFileName = "console-diagnostics",
): ConsoleDiagnosticsService {
  return {
    getReport() {
      return createConsoleDiagnosticsReport(data.getSnapshot());
    },
    toJson() {
      return formatConsoleDiagnosticsJson(data.getSnapshot());
    },
    async copyJson() {
      await copyConsoleDiagnostics(data.getSnapshot());
    },
    downloadJson({ fileName = defaultFileName } = {}) {
      downloadConsoleDiagnostics(data.getSnapshot(), { fileName });
    },
  };
}

const actionIds = {
  copyJson: `${CONSOLE_DIAGNOSTICS_ADDON_ID}:copy-json`,
  downloadJson: `${CONSOLE_DIAGNOSTICS_ADDON_ID}:download-json`,
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
 * Creates the first-party console diagnostics addon.
 *
 * Diagnostics intentionally owns raw-vs-resolved pipeline inspection, while
 * @moyarich/console-addon-data-export owns normal logical-data export.
 */
export function createConsoleDiagnosticsAddon(
  options: ConsoleDiagnosticsAddonOptions = {},
): ConsoleAddon {
  const {
    actions: { copyJson = true, downloadJson = true } = {},
    fileName = "console-diagnostics",
  } = options;

  return {
    id: CONSOLE_DIAGNOSTICS_ADDON_ID,

    activate(host) {
      const data = host.services.require(consoleServices.data);
      const service = createConsoleDiagnosticsService(data, fileName);
      const disabled = (context: { hasMessages: boolean }) =>
        !context.hasMessages;

      if (copyJson) {
        const action: ConsolePanelAction = {
          id: actionIds.copyJson,
          label: "Copy diagnostics JSON",
          disabled,
          onSelect: () => service.copyJson(),
        };

        registerPanelAction(host, action);
        registerContextMenuAction(host, {
          id: actionIds.copyJson,
          label: "Copy diagnostics JSON",
          visible: (context) => context.kind === "console",
          disabled,
          onSelect: () => service.copyJson(),
        });
      }

      if (downloadJson) {
        registerPanelAction(host, {
          id: actionIds.downloadJson,
          label: "Download diagnostics JSON",
          disabled,
          onSelect: () => service.downloadJson({ fileName }),
        });
      }
    },
  };
}
