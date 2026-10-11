import { useId, useMemo, useSyncExternalStore } from "react";
import type { ConsoleMessageData } from "@moyarich/console-core";
import {
  CONSOLE_FILTERING_METHODS,
  type ConsoleFilteringController,
  type ConsoleFilteringControlsProps,
  type ConsoleFilteringState,
} from "../../index";
import "./ConsoleFilteringControls.css";

function useFilteringState(
  controller: ConsoleFilteringController,
): ConsoleFilteringState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}

function normalizeSources(
  messages: readonly ConsoleMessageData[] | undefined,
  sources: readonly string[] | undefined,
): readonly string[] {
  if (sources) {
    return Object.freeze(Array.from(new Set(sources.filter(Boolean))));
  }

  return Object.freeze(
    Array.from(
      new Set(
        (messages ?? []).flatMap((message) =>
          message.source ? [message.source] : [],
        ),
      ),
    ),
  );
}

/** Default first-party controls for method, text, and source filters. */
export function ConsoleFilteringControls({
  controller,
  messages,
  sources,
  className = "",
  style,
}: ConsoleFilteringControlsProps) {
  const state = useFilteringState(controller);
  const methodPopoverId = useId();
  const availableSources = useMemo(
    () => normalizeSources(messages, sources),
    [messages, sources],
  );
  const hasCustomSourceSelection =
    state.sources !== null && state.sources.length !== 1;
  const sourceValue =
    state.sources === null
      ? ""
      : hasCustomSourceSelection
        ? "__custom__"
        : (state.sources[0] ?? "");
  const active =
    state.methods !== null ||
    state.sources !== null ||
    state.text.trim().length > 0;
  const enabledMethods = CONSOLE_FILTERING_METHODS.filter(
    (method) => state.methods === null || state.methods.includes(method),
  );
  const methodLabel =
    state.methods === null ||
    enabledMethods.length === CONSOLE_FILTERING_METHODS.length
      ? "All levels"
      : enabledMethods.length === 0
        ? "No levels"
        : `${enabledMethods.length} levels`;

  return (
    <div
      className={`console-filtering-controls ${className}`.trim()}
      role="search"
      aria-label="Console filters"
      style={style}
    >
      <input
        className="console-filtering-search-input"
        type="search"
        aria-label="Filter console output"
        value={state.text}
        placeholder="Filter console output"
        onChange={(event) => controller.setText(event.currentTarget.value)}
      />

      <div className="console-filtering-actions">
        <div className="console-filtering-method-menu">
          <button
            type="button"
            className="console-filtering-trigger"
            popoverTarget={methodPopoverId}
            aria-controls={methodPopoverId}
          >
            {methodLabel}
          </button>
          <div
            id={methodPopoverId}
            className="console-filtering-method-popover"
            popover="auto"
            role="group"
            aria-label="Message levels"
          >
            {CONSOLE_FILTERING_METHODS.map((method) => {
              const enabled =
                state.methods === null || state.methods.includes(method);

              return (
                <label key={method} className="console-filtering-method-option">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) =>
                      controller.setMethodEnabled(
                        method,
                        event.currentTarget.checked,
                      )
                    }
                  />
                  <span>{method}</span>
                </label>
              );
            })}
          </div>
        </div>

        {availableSources.length > 0 && (
          <select
            className="console-filtering-source-select"
            aria-label="Filter by source"
            value={sourceValue}
            onChange={(event) =>
              controller.setSources(
                event.currentTarget.value ? [event.currentTarget.value] : null,
              )
            }
          >
            <option value="">All sources</option>
            {hasCustomSourceSelection && (
              <option value="__custom__" disabled>
                Custom sources
              </option>
            )}
            {availableSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        )}

        {active && (
          <button
            type="button"
            className="console-filtering-reset"
            aria-label="Reset console filters"
            onClick={() => controller.reset()}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
