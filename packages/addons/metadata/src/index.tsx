import type { ReactNode } from "react";
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
  /** BCP 47 locale for timestamps (for example, en, es, fr, pt-BR, pt-PT). */
  locale?: string;
  /** Reference time in milliseconds for deterministic relative formatting. */
  now?: () => number;
  /** Override the default timestamp formatting. */
  formatTimestamp?: (timestamp: number, mode: TimestampMode) => string;
}

export function formatMetadataTimestamp(
  timestamp: number,
  mode: TimestampMode = "absolute",
  now: number = Date.now(),
  locale?: string,
): string {
  if (!Number.isFinite(timestamp)) return "";
  if (mode === "absolute") return new Date(timestamp).toLocaleString(locale);
  const seconds = Math.round((timestamp - now) / 1000);
  const abs = Math.abs(seconds);
  const unit: Intl.RelativeTimeFormatUnit =
    abs < 60 ? "second" : abs < 3600 ? "minute" : abs < 86400 ? "hour" : "day";
  const divisor = unit === "second" ? 1 : unit === "minute" ? 60 : unit === "hour" ? 3600 : 86400;
  return new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" }).format(
    Math.trunc(seconds / divisor),
    unit,
  );
}

export function getMetadataLabels(
  context: ConsoleOutputEntryDecoratorContext,
  options: ConsoleMetadataOptions = {},
): { source?: string; timestamp?: string } {
  const raw =
    context.mode === "console" ? context.message : context.entry.metadata;
  const source = options.source === false ? undefined : raw?.source;
  const time = options.timestamp === false ? undefined : raw?.timestamp;
  const mode = options.mode ?? "absolute";
  const timestamp =
    typeof time === "number" && Number.isFinite(time)
      ? (options.formatTimestamp?.(time, mode) ??
        formatMetadataTimestamp(time, mode, options.now?.() ?? Date.now(), options.locale))
      : undefined;
  return {
    source: typeof source === "string" && source.trim() ? source : undefined,
    timestamp: timestamp || undefined,
  };
}

/** Wraps the host-rendered entry without editing its source data. */
export function createConsoleMetadataAddon(
  options: ConsoleMetadataOptions = {},
): ConsoleAddon {
  const decorator: ConsoleOutputEntryDecorator = {
    render(context) {
      const { source, timestamp } = getMetadataLabels(context, options);
      if (!source && !timestamp) return context.renderDefault();
      return (
        <div className="console-metadata-entry">
          <div className="console-metadata-labels">
            {source && (
              <span className="console-metadata-source">{source}</span>
            )}
            {timestamp && (
              <time className="console-metadata-timestamp">{timestamp}</time>
            )}
          </div>
          {context.renderDefault() as ReactNode}
        </div>
      );
    },
  };
  return {
    id: CONSOLE_METADATA_ADDON_ID,
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputEntryDecorator,
        decorator,
        {
          id: `${CONSOLE_METADATA_ADDON_ID}:output-entry`,
        },
      );
    },
  };
}
