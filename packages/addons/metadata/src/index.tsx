import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputEntryDecorator,
  type ConsoleOutputEntryDecoratorContext,
} from "@moyarich/console-core";
import "./Metadata.css";

export const CONSOLE_METADATA_ADDON_ID = "@moyarich/console-addon-metadata";

export type TimestampMode = "absolute" | "relative";
export interface ConsoleMetadataOptions {
  /** Display source labels. @default true */
  source?: boolean;
  /** Display timestamps. @default true */
  timestamp?: boolean;
  /** Timestamp formatting mode. @default "absolute" */
  mode?: TimestampMode;
  /** Reference time in milliseconds for deterministic relative formatting. */
  now?: () => number;
  /** Override the default timestamp formatting. */
  formatTimestamp?: (timestamp: number, mode: TimestampMode) => string;
}

export function formatMetadataTimestamp(
  timestamp: number,
  mode: TimestampMode = "absolute",
  now: number = Date.now(),
): string {
  if (!Number.isFinite(timestamp)) return "";
  if (mode === "absolute") return new Date(timestamp).toLocaleString();
  const seconds = Math.round((now - timestamp) / 1000);
  if (seconds < 0) return "in " + Math.abs(seconds) + "s";
  if (seconds < 60) return seconds + "s ago";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
}

export function getMetadataLabels(
  context: ConsoleOutputEntryDecoratorContext,
  options: ConsoleMetadataOptions = {},
): { source?: string; timestamp?: string } {
  const raw = context.mode === "console" ? context.message : context.entry.metadata;
  const source = options.source === false ? undefined : raw?.source;
  const time = options.timestamp === false ? undefined : raw?.timestamp;
  const mode = options.mode ?? "absolute";
  const timestamp = typeof time === "number" && Number.isFinite(time)
    ? (options.formatTimestamp?.(time, mode) ??
      formatMetadataTimestamp(time, mode, options.now?.() ?? Date.now()))
    : undefined;
  return {
    source: typeof source === "string" && source.trim() ? source : undefined,
    timestamp: timestamp || undefined,
  };
}

/** Wraps the host-rendered entry without editing its source data. */
export function createConsoleMetadataAddon(options: ConsoleMetadataOptions = {}): ConsoleAddon {
  const decorator: ConsoleOutputEntryDecorator = {
    render(context) {
      const { source, timestamp } = getMetadataLabels(context, options);
      if (!source && !timestamp) return context.renderDefault();
      return (
        <div className="console-metadata-entry">
          <div className="console-metadata-labels">
            {source && <span className="console-metadata-source">{source}</span>}
            {timestamp && <time className="console-metadata-timestamp">{timestamp}</time>}
          </div>
          {context.renderDefault()}
        </div>
      );
    },
  };
  return {
    id: CONSOLE_METADATA_ADDON_ID,
    activate(host) {
      host.extensions.register(consoleExtensionPoints.outputEntryDecorator, decorator, {
        id: `${CONSOLE_METADATA_ADDON_ID}:output-entry`,
      });
    },
  };
}
