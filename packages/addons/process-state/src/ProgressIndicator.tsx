import {
  resolveProcessStateMessages,
  type ProcessStateTranslations,
} from "./localization";
import { useSyncExternalStore, type CSSProperties } from "react";
import type { ProcessStateController } from "./index";
import "./ProgressIndicator.css";

export interface ConsoleProgressIndicatorOptions {
  locale?: string;
  translations?: ProcessStateTranslations;
  className?: string;
  style?: CSSProperties;
  /** Custom label for the determinate progress mode. */
  format?: (percentage: number, state: number) => string;
  /** Keep the progress strip visible after a clear command. */
  showCleared?: boolean;
}

export interface ConsoleProgressIndicatorProps extends ConsoleProgressIndicatorOptions {
  controller: ProcessStateController;
}

/** Read-only, optional status strip; it never modifies terminal output or scroll position. */
export function ConsoleProgressIndicator({
  controller,
  className,
  style,
  format,
  showCleared = false,
  locale = "en",
  translations,
}: ConsoleProgressIndicatorProps) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  const progress = state.progress;
  const labels = resolveProcessStateMessages(locale, translations);
  if (!progress || (progress.state === 0 && !showCleared)) return null;
  const value = progress.value ?? 0;
  const label =
    progress.state === 0
      ? labels.cleared
      : progress.state === 3
        ? labels.working
        : progress.state === 2
          ? labels.error
          : progress.state === 4
            ? labels.paused
            : labels.progress;
  const description =
    progress.state === 0
      ? label
      : progress.state === 3
        ? label
        : (format?.(value, progress.state) ?? `${label}: ${value}%`);
  return (
    <div
      className={["console-progress-indicator", className]
        .filter(Boolean)
        .join(" ")}
      data-state={progress.state}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={description}
    >
      <span className="console-progress-indicator__label">{description}</span>
      {progress.state !== 0 && (
        <div
          className="console-progress-indicator__track"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.state === 3 ? undefined : value}
        >
          <div
            className="console-progress-indicator__fill"
            style={{ width: `${progress.state === 3 ? 30 : value}%` }}
          />
        </div>
      )}
    </div>
  );
}
