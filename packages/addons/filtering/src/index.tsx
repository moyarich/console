import {
  useId,
  useMemo,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleServiceToken,
  serializeConsoleValue,
  type ConsoleAddon,
  type ConsoleDataService,
  type ConsoleFrameDecorator,
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

export interface ConsoleFilteringControlsOptions {
  /** Explicit source choices. When omitted, sources are discovered from retained messages. */
  sources?: readonly string[];
  /** Additional class name applied to the addon-owned controls. */
  className?: string;
  /** Inline styles and theme custom-property overrides for the controls. */
  style?: CSSProperties;
}

export interface ConsoleFilteringAddonOptions {
  /** Reuse a host-owned controller instead of creating one. */
  controller?: ConsoleFilteringController;
  /** Initial state used when the addon creates its controller. */
  initialState?: ConsoleFilteringStateInput;
  /** Set to false for a headless addon with no default UI contribution. */
  controls?: false | ConsoleFilteringControlsOptions;
}

export interface ConsoleFilteringAddon extends ConsoleAddon {
  readonly controller: ConsoleFilteringController;
}

export interface ConsoleFilteringControlsProps
  extends ConsoleFilteringControlsOptions {
  controller: ConsoleFilteringController;
  /** Messages used to discover source choices. */
  messages?: readonly ConsoleMessageData[];
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
      const currentMethods = state.methods ?? ALL_CONSOLE_METHODS;
      const next = new Set(currentMethods);

      if (enabled) {
        next.add(method);
      } else {
        next.delete(method);
      }

      const methods = Array.from(next);
      const includesEveryMethod =
        methods.length === ALL_CONSOLE_METHODS.length &&
        ALL_CONSOLE_METHODS.every((candidate) => next.has(candidate));

      controller.setMethods(includesEveryMethod ? null : methods);
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

interface ConsoleFilteringFrameProps {
  controller: ConsoleFilteringController;
  data?: ConsoleDataService;
  options: ConsoleFilteringControlsOptions;
  children: ReactNode;
}

function useConsoleDataSnapshot(data: ConsoleDataService | undefined) {
  return useSyncExternalStore(
    (listener) => {
      if (!data) return () => undefined;
      const subscription = data.subscribe(listener);
      return () => subscription.dispose();
    },
    () => data?.getSnapshot(),
    () => data?.getSnapshot(),
  );
}

function ConsoleFilteringFrame({
  controller,
  data,
  options,
  children,
}: ConsoleFilteringFrameProps) {
  const snapshot = useConsoleDataSnapshot(data);
  const messages = snapshot?.mode === "console" ? snapshot.all : undefined;

  return (
    <div className="console-filtering-frame">
      <ConsoleFilteringControls
        controller={controller}
        messages={messages}
        {...options}
      />
      {children}
    </div>
  );
}

const filterRegistrationId = `${CONSOLE_FILTERING_ADDON_ID}:message-filter`;
const frameRegistrationId = `${CONSOLE_FILTERING_ADDON_ID}:frame`;

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
    options.controller ??
    createConsoleFilteringController(options.initialState);
  const controls = options.controls === false ? undefined : (options.controls ?? {});

  return {
    id: CONSOLE_FILTERING_ADDON_ID,
    controller,

    activate(host) {
      host.services.provide(consoleFilteringService, controller);

      let filterRegistration = host.extensions.register(
        consoleExtensionPoints.messageFilter,
        createConsoleMessageFilter(controller.getState()),
        { id: filterRegistrationId },
      );

      const unsubscribe = controller.subscribe(() => {
        filterRegistration.dispose();
        filterRegistration = host.extensions.register(
          consoleExtensionPoints.messageFilter,
          createConsoleMessageFilter(controller.getState()),
          { id: filterRegistrationId },
        );
      });

      host.scope.defer(unsubscribe);

      if (controls) {
        const data = host.services.get(consoleServices.data);
        const decorator: ConsoleFrameDecorator<ReactNode> = {
          render(context) {
            if (context.mode !== "console") return undefined;

            return (
              <ConsoleFilteringFrame
                controller={controller}
                data={data}
                options={controls}
              >
                {context.renderDefault()}
              </ConsoleFilteringFrame>
            );
          },
        };

        host.extensions.register(
          consoleExtensionPoints.frameDecorator,
          decorator,
          { id: frameRegistrationId },
        );
      }
    },
  };
}
