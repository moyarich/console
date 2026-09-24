import { useMemo, useSyncExternalStore } from "react";
import {
  consoleExtensionPoints,
  createConsoleServiceToken,
  serializeConsoleValue,
  type ConsoleAddon,
  type ConsoleMessageData,
  type ConsoleMessageFilter,
  type ConsoleMethod,
} from "@moyarich/console-core";
import "./styles.css";

/** Stable package-qualified identity for the filtering addon. */
export const CONSOLE_FILTERING_ADDON_ID = "@moyarich/console-addon-filtering";

/** Common console methods exposed by the first-party filtering controls. */
export const CONSOLE_FILTERING_METHODS = [
  "log",
  "info",
  "warn",
  "error",
  "debug",
] as const satisfies readonly ConsoleMethod[];

export type ConsoleFilteringMethod = (typeof CONSOLE_FILTERING_METHODS)[number];

const ALL_CONSOLE_METHODS = [
  "log",
  "debug",
  "info",
  "warn",
  "error",
  "assert",
  "dir",
  "table",
  "count",
  "timeEnd",
  "trace",
  "group",
  "groupCollapsed",
] as const satisfies readonly ConsoleMethod[];

export interface ConsoleFilteringState {
  /** Allowed methods. Null means all methods are visible. */
  readonly methods: readonly ConsoleMethod[] | null;
  /** Case-insensitive text query matched against method, source, and values. */
  readonly text: string;
  /** Allowed sources. Null means all sources are visible. */
  readonly sources: readonly string[] | null;
}

export type ConsoleFilteringStateInput = Partial<ConsoleFilteringState>;

export interface ConsoleFilteringController {
  getState(): ConsoleFilteringState;
  subscribe(listener: () => void): () => void;
  setState(next: ConsoleFilteringStateInput): void;
  setText(text: string): void;
  setMethods(methods: readonly ConsoleMethod[] | null): void;
  setSources(sources: readonly string[] | null): void;
  setMethodEnabled(method: ConsoleMethod, enabled: boolean): void;
  reset(): void;
  matches(message: ConsoleMessageData): boolean;
}

export interface ConsoleFilteringAddonOptions {
  /** Reuse a host-owned controller instead of creating one. */
  controller?: ConsoleFilteringController;
  /** Initial state used when the addon creates its controller. */
  initialState?: ConsoleFilteringStateInput;
}

export interface ConsoleFilteringAddon extends ConsoleAddon {
  readonly controller: ConsoleFilteringController;
}

export interface ConsoleFilteringControlsProps {
  controller: ConsoleFilteringController;
  /** Messages used to discover source choices. */
  messages?: readonly ConsoleMessageData[];
  /** Explicit source choices. Takes precedence over sources discovered from messages. */
  sources?: readonly string[];
  className?: string;
}

/** Service token exposed while the filtering addon is active. */
export const consoleFilteringService =
  createConsoleServiceToken<ConsoleFilteringController>(
    `${CONSOLE_FILTERING_ADDON_ID}.controller`,
  );

function dedupe<T>(values: readonly T[]): readonly T[] {
  return Object.freeze(Array.from(new Set(values)));
}

function normalizeState(
  input: ConsoleFilteringStateInput = {},
): ConsoleFilteringState {
  return Object.freeze({
    methods:
      input.methods === undefined || input.methods === null
        ? null
        : dedupe(input.methods),
    text: input.text ?? "",
    sources:
      input.sources === undefined || input.sources === null
        ? null
        : dedupe(input.sources),
  });
}

function arraysEqual<T>(
  left: readonly T[] | null,
  right: readonly T[] | null,
): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function statesEqual(
  left: ConsoleFilteringState,
  right: ConsoleFilteringState,
): boolean {
  return (
    left.text === right.text &&
    arraysEqual(left.methods, right.methods) &&
    arraysEqual(left.sources, right.sources)
  );
}

function formatFilterValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return [value.name, value.message, value.stack].filter(Boolean).join(" ");
  }

  try {
    const serialized = JSON.stringify(serializeConsoleValue(value));
    return serialized ?? String(value);
  } catch {
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  }
}

/** Returns the searchable text representation used by the text filter. */
export function getConsoleMessageFilterText(
  message: ConsoleMessageData,
): string {
  return [
    message.method,
    message.source ?? "",
    ...message.data.map(formatFilterValue),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

/** Evaluates one message against a normalized filtering state. */
export function matchesConsoleMessage(
  message: ConsoleMessageData,
  state: ConsoleFilteringState,
): boolean {
  if (state.methods && !state.methods.includes(message.method)) {
    return false;
  }

  if (
    state.sources &&
    (!message.source || !state.sources.includes(message.source))
  ) {
    return false;
  }

  const query = state.text.trim().toLocaleLowerCase();

  return !query || getConsoleMessageFilterText(message).includes(query);
}

/** Creates a standalone predicate from fixed filtering criteria. */
export function createConsoleMessageFilter(
  state: ConsoleFilteringStateInput = {},
): ConsoleMessageFilter {
  const normalized = normalizeState(state);
  return (message) => matchesConsoleMessage(message, normalized);
}

/** Creates a small observable controller for headless or React filter controls. */
export function createConsoleFilteringController(
  initialState: ConsoleFilteringStateInput = {},
): ConsoleFilteringController {
  const initial = normalizeState(initialState);
  let state = initial;
  const listeners = new Set<() => void>();

  const update = (next: ConsoleFilteringState) => {
    if (statesEqual(state, next)) return;
    state = next;

    for (const listener of listeners) {
      listener();
    }
  };

  const controller: ConsoleFilteringController = {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setState(next) {
      update(
        normalizeState({
          methods: "methods" in next ? next.methods : state.methods,
          text: "text" in next ? next.text : state.text,
          sources: "sources" in next ? next.sources : state.sources,
        }),
      );
    },

    setText(text) {
      controller.setState({ text });
    },

    setMethods(methods) {
      controller.setState({ methods });
    },

    setSources(sources) {
      controller.setState({ sources });
    },

    setMethodEnabled(method, enabled) {
      const methods = state.methods ?? ALL_CONSOLE_METHODS;
      const next = new Set(methods);

      if (enabled) {
        next.add(method);
      } else {
        next.delete(method);
      }

      controller.setMethods(Array.from(next));
    },

    reset() {
      update(initial);
    },

    matches(message) {
      return matchesConsoleMessage(message, state);
    },
  };

  return controller;
}

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
    return dedupe(sources.filter(Boolean));
  }

  return dedupe(
    (messages ?? []).flatMap((message) =>
      message.source ? [message.source] : [],
    ),
  );
}

/** Default first-party controls for method, text, and source filters. */
export function ConsoleFilteringControls({
  controller,
  messages,
  sources,
  className = "",
}: ConsoleFilteringControlsProps) {
  const state = useFilteringState(controller);
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

  return (
    <div
      className={`console-filtering-controls ${className}`.trim()}
      role="group"
      aria-label="Console filters"
    >
      <div
        className="console-filtering-methods"
        role="group"
        aria-label="Message methods"
      >
        {CONSOLE_FILTERING_METHODS.map((method) => {
          const enabled =
            state.methods === null || state.methods.includes(method);

          return (
            <button
              key={method}
              type="button"
              className="console-filtering-method"
              aria-pressed={enabled}
              onClick={() => controller.setMethodEnabled(method, !enabled)}
            >
              {method}
            </button>
          );
        })}
      </div>

      <label className="console-filtering-field console-filtering-search">
        <span className="console-filtering-label">Filter</span>
        <input
          type="search"
          value={state.text}
          placeholder="Filter console output"
          onChange={(event) => controller.setText(event.currentTarget.value)}
        />
      </label>

      {availableSources.length > 0 && (
        <label className="console-filtering-field">
          <span className="console-filtering-label">Source</span>
          <select
            value={sourceValue}
            onChange={(event) =>
              controller.setSources(
                event.currentTarget.value
                  ? [event.currentTarget.value]
                  : null,
              )
            }
          >
            <option value="">All sources</option>
            {hasCustomSourceSelection && (
              <option value="__custom__" disabled>
                Custom selection
              </option>
            )}
            {availableSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
      )}

      {active && (
        <button
          type="button"
          className="console-filtering-reset"
          onClick={() => controller.reset()}
        >
          Reset
        </button>
      )}
    </div>
  );
}

const filterRegistrationId = `${CONSOLE_FILTERING_ADDON_ID}:message-filter`;

/**
 * Creates the first-party filtering addon.
 *
 * The addon contributes one message predicate and exposes its controller as a
 * service. Controller changes replace the predicate contribution so mounted
 * Console hosts immediately recompute their visible-message view.
 */
export function createConsoleFilteringAddon(
  options: ConsoleFilteringAddonOptions = {},
): ConsoleFilteringAddon {
  const controller =
    options.controller ?? createConsoleFilteringController(options.initialState);

  return {
    id: CONSOLE_FILTERING_ADDON_ID,
    controller,

    activate(host) {
      host.services.provide(consoleFilteringService, controller);

      let registration = host.extensions.register(
        consoleExtensionPoints.messageFilter,
        createConsoleMessageFilter(controller.getState()),
        { id: filterRegistrationId },
      );

      const unsubscribe = controller.subscribe(() => {
        registration.dispose();
        registration = host.extensions.register(
          consoleExtensionPoints.messageFilter,
          createConsoleMessageFilter(controller.getState()),
          { id: filterRegistrationId },
        );
      });

      host.scope.defer(unsubscribe);

      return () => registration.dispose();
    },
  };
}
