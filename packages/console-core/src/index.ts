/** Version of the public addon-host contract. */
export const CONSOLE_ADDON_API_VERSION = "1";

/** Resource that can be released deterministically. */
export interface ConsoleDisposable {
  dispose(): void;
}

/** Cleanup value optionally returned from {@link ConsoleAddon.activate}. */
export type ConsoleAddonCleanup = void | (() => void) | ConsoleDisposable;

/**
 * A console addon owns lifecycle only. Feature-specific behavior is registered
 * through extension points and services on the addon host.
 */
export interface ConsoleAddon {
  /**
   * Stable, package-qualified identifier used for lifecycle management and
   * duplicate detection. Prefer the npm package name, or
   * `<package>:<feature>` when one package provides multiple addons.
   */
  readonly id: string;
  /** Activates the addon against one scoped console host. */
  activate(host: ConsoleAddonHost): ConsoleAddonCleanup;
}

/** Typed token identifying a multi-provider extension point. */
export interface ConsoleExtensionPoint<T> {
  readonly id: string;
  readonly __consoleExtensionType?: T;
}

/** Ordering metadata for one extension contribution. */
export interface ConsoleExtensionRegistrationOptions {
  /** Optional identifier unique within this extension point. */
  readonly id?: string;
  /** Higher priorities are returned before lower priorities. @default 0 */
  readonly priority?: number;
}

/** Registry for ordered, multi-provider console extensions. */
export interface ConsoleExtensionRegistry {
  register<T>(
    point: ConsoleExtensionPoint<T>,
    contribution: T,
    options?: ConsoleExtensionRegistrationOptions,
  ): ConsoleDisposable;
  getAll<T>(point: ConsoleExtensionPoint<T>): readonly T[];
  subscribe(listener: () => void): ConsoleDisposable;
}

/** Typed token identifying a single-provider service. */
export interface ConsoleServiceToken<T> {
  readonly id: string;
  readonly __consoleServiceType?: T;
}

/** Registry for shared core/addon APIs and stateful services. */
export interface ConsoleServiceRegistry {
  has<T>(token: ConsoleServiceToken<T>): boolean;
  get<T>(token: ConsoleServiceToken<T>): T | undefined;
  require<T>(token: ConsoleServiceToken<T>): T;
  provide<T>(token: ConsoleServiceToken<T>, service: T): ConsoleDisposable;
  subscribe(listener: () => void): ConsoleDisposable;
}

/** Stable identifier for optional host functionality. */
export interface ConsoleCapability {
  readonly id: string;
}

/** Read-only capability discovery available to addons. */
export interface ConsoleCapabilityRegistry {
  has(capability: ConsoleCapability): boolean;
  getAll(): readonly ConsoleCapability[];
}

/** Disposable collection owned by one addon activation. */
export interface ConsoleDisposableScope extends ConsoleDisposable {
  add<T extends ConsoleDisposable>(disposable: T): T;
  defer(cleanup: () => void): ConsoleDisposable;
}

/** Public surface supplied to one addon activation. */
export interface ConsoleAddonHost {
  readonly version: string;
  readonly extensions: ConsoleExtensionRegistry;
  readonly services: ConsoleServiceRegistry;
  readonly capabilities: ConsoleCapabilityRegistry;
  readonly scope: ConsoleDisposableScope;
}

/** Options used to construct an addon manager. */
export interface CreateConsoleAddonManagerOptions {
  readonly version?: string;
  readonly capabilities?: readonly ConsoleCapability[];
}

/** Loads addons and owns the registries shared by those addon activations. */
export interface ConsoleAddonManager extends ConsoleDisposable {
  readonly version: string;
  readonly extensions: ConsoleExtensionRegistry;
  readonly services: ConsoleServiceRegistry;
  readonly capabilities: ConsoleCapabilityRegistry;
  load(addon: ConsoleAddon): ConsoleDisposable;
  unload(id: string): boolean;
  has(id: string): boolean;
}

function validateIdentifier(id: string, kind: string): string {
  const normalized = id.trim();

  if (!normalized) {
    throw new Error(`${kind} id must not be empty.`);
  }

  return normalized;
}

function createDisposable(disposeValue: () => void): ConsoleDisposable {
  let disposed = false;

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeValue();
    },
  };
}

function isDisposable(value: unknown): value is ConsoleDisposable {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispose" in value &&
    typeof value.dispose === "function"
  );
}

class DisposableScope implements ConsoleDisposableScope {
  private readonly disposables = new Set<ConsoleDisposable>();
  private disposed = false;

  add<T extends ConsoleDisposable>(disposable: T): T {
    if (this.disposed) {
      disposable.dispose();
      return disposable;
    }

    this.disposables.add(disposable);
    return disposable;
  }

  defer(cleanup: () => void): ConsoleDisposable {
    return this.add(createDisposable(cleanup));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    const disposables = Array.from(this.disposables).reverse();
    this.disposables.clear();

    for (const disposable of disposables) {
      disposable.dispose();
    }
  }
}

interface ExtensionRegistration {
  readonly contribution: unknown;
  readonly registrationId?: string;
  readonly priority: number;
  readonly order: number;
}

class ExtensionRegistry implements ConsoleExtensionRegistry {
  private readonly registrations = new Map<string, ExtensionRegistration[]>();
  private readonly listeners = new Set<() => void>();
  private nextOrder = 0;

  register<T>(
    point: ConsoleExtensionPoint<T>,
    contribution: T,
    options: ConsoleExtensionRegistrationOptions = {},
  ): ConsoleDisposable {
    const pointId = validateIdentifier(point.id, "Extension point");
    const registrationId = options.id?.trim() || undefined;
    const priority = options.priority ?? 0;

    if (!Number.isFinite(priority)) {
      throw new Error(
        `Extension priority for "${pointId}" must be a finite number.`,
      );
    }

    const registrations = this.registrations.get(pointId) ?? [];

    if (
      registrationId &&
      registrations.some(
        (registration) => registration.registrationId === registrationId,
      )
    ) {
      throw new Error(
        `Extension "${registrationId}" is already registered for "${pointId}".`,
      );
    }

    const registration: ExtensionRegistration = {
      contribution,
      ...(registrationId ? { registrationId } : {}),
      priority,
      order: this.nextOrder++,
    };

    registrations.push(registration);
    this.registrations.set(pointId, registrations);
    this.emit();

    return createDisposable(() => {
      const current = this.registrations.get(pointId);
      if (!current) return;

      const index = current.indexOf(registration);
      if (index === -1) return;

      current.splice(index, 1);

      if (current.length === 0) {
        this.registrations.delete(pointId);
      }

      this.emit();
    });
  }

  getAll<T>(point: ConsoleExtensionPoint<T>): readonly T[] {
    const pointId = validateIdentifier(point.id, "Extension point");
    const registrations = this.registrations.get(pointId) ?? [];

    return registrations
      .slice()
      .sort(
        (left, right) =>
          right.priority - left.priority || left.order - right.order,
      )
      .map((registration) => registration.contribution as T);
  }

  subscribe(listener: () => void): ConsoleDisposable {
    this.listeners.add(listener);
    return createDisposable(() => this.listeners.delete(listener));
  }

  clear(): void {
    if (this.registrations.size === 0) return;
    this.registrations.clear();
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Registry listeners must not break extension registration.
      }
    }
  }
}

class ServiceRegistry implements ConsoleServiceRegistry {
  private readonly services = new Map<string, unknown>();
  private readonly listeners = new Set<() => void>();

  has<T>(token: ConsoleServiceToken<T>): boolean {
    return this.services.has(validateIdentifier(token.id, "Service"));
  }

  get<T>(token: ConsoleServiceToken<T>): T | undefined {
    return this.services.get(validateIdentifier(token.id, "Service")) as
      T | undefined;
  }

  require<T>(token: ConsoleServiceToken<T>): T {
    const id = validateIdentifier(token.id, "Service");
    const service = this.services.get(id) as T | undefined;

    if (service === undefined) {
      throw new Error(`Console service "${id}" is not available.`);
    }

    return service;
  }

  provide<T>(token: ConsoleServiceToken<T>, service: T): ConsoleDisposable {
    const id = validateIdentifier(token.id, "Service");

    if (this.services.has(id)) {
      throw new Error(`Console service "${id}" already has a provider.`);
    }

    this.services.set(id, service);
    this.emit();

    return createDisposable(() => {
      if (this.services.get(id) !== service) return;
      this.services.delete(id);
      this.emit();
    });
  }

  subscribe(listener: () => void): ConsoleDisposable {
    this.listeners.add(listener);
    return createDisposable(() => this.listeners.delete(listener));
  }

  clear(): void {
    if (this.services.size === 0) return;
    this.services.clear();
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Registry listeners must not break service registration.
      }
    }
  }
}

class CapabilityRegistry implements ConsoleCapabilityRegistry {
  private readonly capabilities = new Map<string, ConsoleCapability>();

  constructor(capabilities: readonly ConsoleCapability[] = []) {
    for (const capability of capabilities) {
      const id = validateIdentifier(capability.id, "Capability");
      this.capabilities.set(id, capability);
    }
  }

  has(capability: ConsoleCapability): boolean {
    return this.capabilities.has(
      validateIdentifier(capability.id, "Capability"),
    );
  }

  getAll(): readonly ConsoleCapability[] {
    return Array.from(this.capabilities.values());
  }
}

/** Creates a typed multi-provider extension-point token. */
export function createConsoleExtensionPoint<T>(
  id: string,
): ConsoleExtensionPoint<T> {
  return Object.freeze({ id: validateIdentifier(id, "Extension point") });
}

/** Creates an independent extension registry for advanced/headless hosts. */
export function createConsoleExtensionRegistry(): ConsoleExtensionRegistry {
  return new ExtensionRegistry();
}

/** Creates a typed single-provider service token. */
export function createConsoleServiceToken<T>(
  id: string,
): ConsoleServiceToken<T> {
  return Object.freeze({ id: validateIdentifier(id, "Service") });
}

/** Creates an independent service registry for advanced/headless hosts. */
export function createConsoleServiceRegistry(): ConsoleServiceRegistry {
  return new ServiceRegistry();
}

/** Creates a stable capability identifier. */
export function createConsoleCapability(id: string): ConsoleCapability {
  return Object.freeze({ id: validateIdentifier(id, "Capability") });
}

/** Creates an independent read-only capability registry. */
export function createConsoleCapabilityRegistry(
  capabilities: readonly ConsoleCapability[] = [],
): ConsoleCapabilityRegistry {
  return new CapabilityRegistry(capabilities);
}

/** Creates an idempotent disposable collection. */
export function createConsoleDisposableScope(): ConsoleDisposableScope {
  return new DisposableScope();
}

function createScopedExtensionRegistry(
  registry: ConsoleExtensionRegistry,
  scope: ConsoleDisposableScope,
): ConsoleExtensionRegistry {
  return {
    register<T>(
      point: ConsoleExtensionPoint<T>,
      contribution: T,
      options?: ConsoleExtensionRegistrationOptions,
    ) {
      return scope.add(registry.register(point, contribution, options));
    },
    getAll<T>(point: ConsoleExtensionPoint<T>) {
      return registry.getAll(point);
    },
    subscribe(listener: () => void) {
      return scope.add(registry.subscribe(listener));
    },
  };
}

function createScopedServiceRegistry(
  registry: ConsoleServiceRegistry,
  scope: ConsoleDisposableScope,
): ConsoleServiceRegistry {
  return {
    has<T>(token: ConsoleServiceToken<T>) {
      return registry.has(token);
    },
    get<T>(token: ConsoleServiceToken<T>) {
      return registry.get(token);
    },
    require<T>(token: ConsoleServiceToken<T>) {
      return registry.require(token);
    },
    provide<T>(token: ConsoleServiceToken<T>, service: T) {
      const registration = registry.provide(token, service);

      if (isDisposable(service)) {
        scope.add(service);
      }

      return scope.add(registration);
    },
    subscribe(listener: () => void) {
      return scope.add(registry.subscribe(listener));
    },
  };
}

function addCleanup(
  scope: ConsoleDisposableScope,
  cleanup: ConsoleAddonCleanup,
): void {
  if (typeof cleanup === "function") {
    scope.defer(cleanup);
  } else if (cleanup) {
    scope.add(cleanup);
  }
}

/**
 * Creates an addon manager suitable for UI or headless console hosts.
 *
 * Each loaded addon receives a scoped host. Registrations made through that
 * host are automatically removed when the addon is unloaded.
 */
export function createConsoleAddonManager(
  options: CreateConsoleAddonManagerOptions = {},
): ConsoleAddonManager {
  const extensions = new ExtensionRegistry();
  const services = new ServiceRegistry();
  const capabilities = new CapabilityRegistry(options.capabilities);
  const version = options.version ?? CONSOLE_ADDON_API_VERSION;
  const loaded = new Map<
    string,
    {
      addon: ConsoleAddon;
      scope: ConsoleDisposableScope;
    }
  >();
  let disposed = false;

  const unloadAddon = (id: string, expectedAddon?: ConsoleAddon): boolean => {
    const normalizedId = validateIdentifier(id, "Addon");
    const current = loaded.get(normalizedId);

    if (!current || (expectedAddon && current.addon !== expectedAddon)) {
      return false;
    }

    loaded.delete(normalizedId);
    current.scope.dispose();
    return true;
  };

  const manager: ConsoleAddonManager = {
    version,
    extensions,
    services,
    capabilities,
    load(addon) {
      if (disposed) {
        throw new Error(
          "Cannot load an addon after the addon manager is disposed.",
        );
      }

      const id = validateIdentifier(addon.id, "Addon");

      if (loaded.has(id)) {
        throw new Error(`Console addon "${id}" is already loaded.`);
      }

      const scope = createConsoleDisposableScope();
      const host: ConsoleAddonHost = {
        version,
        extensions: createScopedExtensionRegistry(extensions, scope),
        services: createScopedServiceRegistry(services, scope),
        capabilities,
        scope,
      };

      try {
        addCleanup(scope, addon.activate(host));
      } catch (error) {
        scope.dispose();
        throw error;
      }

      loaded.set(id, { addon, scope });

      return createDisposable(() => {
        unloadAddon(id, addon);
      });
    },
    unload(id) {
      return unloadAddon(id);
    },
    has(id) {
      return loaded.has(validateIdentifier(id, "Addon"));
    },
    dispose() {
      if (disposed) return;
      disposed = true;

      const records = Array.from(loaded.values()).reverse();
      loaded.clear();

      for (const record of records) {
        record.scope.dispose();
      }

      extensions.clear();
      services.clear();
    },
  };

  return manager;
}

/** Structured console message method understood by console hosts. */
export type ConsoleMethod =
  | "log"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "assert"
  | "dir"
  | "table"
  | "count"
  | "timeEnd"
  | "trace"
  | "group"
  | "groupCollapsed";

/** Rendering/data mode understood by console hosts. */
export type ConsoleMode = "console" | "ansi";

/** Structured message shared by hosts, transports, and addons. */
export interface ConsoleMessageData {
  id?: string;
  method: ConsoleMethod;
  data: unknown[];
  depth: number;
  timestamp?: number;
  source?: string;
  columns?: string[];
  expandLevel?: number;
  showNonenumerable?: boolean;
}

/** Predicate used to decide whether a structured console message is visible. */
export type ConsoleMessageFilter = (
  message: ConsoleMessageData,
  index: number,
  messages: readonly ConsoleMessageData[],
) => boolean;

export interface RunOutput {
  messages: ConsoleMessageData[];
  error?: string;
}

export interface DirOptions {
  depth?: number | null;
  showHidden?: boolean;
}

export type ConsoleEvent =
  { type: "message"; message: ConsoleMessageData } | { type: "clear" };

export interface ConsoleTransportEnvelope {
  type: "CONSOLE_PANEL";
  version: 1;
  channel: string;
  event: ConsoleEvent;
}

export type ConsoleOutputStream = "stdout" | "stderr";
export type ConsoleProcessOutputMetadata = Readonly<Record<string, unknown>>;

export interface ConsoleStdoutEntry {
  id?: string;
  data: string;
  stream?: ConsoleOutputStream;
  metadata?: ConsoleProcessOutputMetadata;
}

export interface ConsoleLink {
  text: string;
  start: number;
  end: number;
  target?: string;
  title?: string;
  action?: (context: ConsoleLinkActionContext) => void;
}

export interface ConsoleLinkProviderContext {
  mode: ConsoleMode;
  value?: unknown;
  propertyKey?: string;
  index?: number;
  id?: string;
  stream?: ConsoleOutputStream;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ConsoleLinkActionContext extends ConsoleLinkProviderContext {
  link: ConsoleLink;
  sourceText: string;
  providerId?: string;
}

export interface ConsoleLinkProvider {
  readonly id?: string;
  provideLinks(
    text: string,
    context: ConsoleLinkProviderContext,
  ): readonly ConsoleLink[] | undefined | void;
}

export interface ConsoleProcessOutput {
  readonly data: string;
  readonly structuredValue?: unknown;
  readonly links?: readonly ConsoleLink[];
  readonly metadata: ConsoleProcessOutputMetadata;
}

export interface ConsoleProcessControlEvent {
  readonly type: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface ConsoleProcessControlOutput {
  readonly data: string;
  readonly metadata: ConsoleProcessOutputMetadata;
}

export interface ConsoleProcessControlParserContext {
  readonly entry: ConsoleStdoutEntry | string;
  readonly index: number;
  readonly id?: string;
  readonly stream?: ConsoleOutputStream;
}

export interface ConsoleProcessControlParserResult {
  data?: string;
  metadata?: Readonly<Record<string, unknown>>;
  events?: readonly ConsoleProcessControlEvent[];
  omit?: boolean;
}

export interface ConsoleProcessControlParser {
  readonly id?: string;
  parse(
    output: ConsoleProcessControlOutput,
    context: ConsoleProcessControlParserContext,
  ): ConsoleProcessControlParserResult | undefined | void;
  reset?(): void;
}

export interface ConsoleProcessOutputProcessorContext {
  readonly entry: ConsoleStdoutEntry | string;
  readonly index: number;
  readonly text: string;
  readonly id?: string;
  readonly stream?: ConsoleOutputStream;
}

export interface ConsoleProcessOutputProcessorResult {
  data?: string;
  structuredValue?: unknown;
  links?: readonly ConsoleLink[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ConsoleProcessOutputProcessor {
  readonly id?: string;
  process(
    output: ConsoleProcessOutput,
    context: ConsoleProcessOutputProcessorContext,
  ): ConsoleProcessOutputProcessorResult | undefined | void;
}

export interface ConsoleResolvedProcessOutputEntry {
  readonly entry: ConsoleStdoutEntry;
  readonly output: ConsoleProcessOutput;
}

export type ConsoleProcessViewEntry = ConsoleResolvedProcessOutputEntry;

export interface ConsoleStructuredOutputParserContext {
  entry: ConsoleStdoutEntry | string;
  index: number;
  id?: string;
  stream?: ConsoleOutputStream;
  metadata?: ConsoleProcessOutputMetadata;
}

export type ConsoleStructuredOutputParser = (
  text: string,
  context: ConsoleStructuredOutputParserContext,
) => unknown | undefined;

export interface ConsoleStructuredDataSnapshot {
  readonly mode: "console";
  readonly all: readonly ConsoleMessageData[];
  readonly visible: readonly ConsoleMessageData[];
}

export interface ConsoleProcessDataSnapshot {
  readonly mode: "ansi";
  readonly rawEntries: readonly (ConsoleStdoutEntry | string)[];
  readonly all: readonly ConsoleProcessViewEntry[];
  readonly visible: readonly ConsoleProcessViewEntry[];
  readonly controlEvents?: readonly ConsoleProcessControlEvent[];
}

export type ConsoleDataSnapshot =
  ConsoleStructuredDataSnapshot | ConsoleProcessDataSnapshot;

export interface ConsoleDataService {
  getSnapshot(): ConsoleDataSnapshot;
  subscribe(listener: () => void): ConsoleDisposable;
}

export interface ConsoleScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

export interface ConsoleViewportService {
  scrollToTop(): void;
  scrollToBottom(): void;
  scrollToMessage(id: string, options?: ConsoleScrollOptions): boolean;
  isAtBottom(): boolean;
  isAtTop(): boolean;
  focus(): void;
}

export interface ConsoleActionContextBase {
  mode: ConsoleMode;
  hasMessages: boolean;
}

export interface ConsoleSurfaceActionContext extends ConsoleActionContextBase {
  kind: "console";
}

export interface ConsoleObjectActionContext extends ConsoleActionContextBase {
  kind: "object";
  value: object;
}

export interface ConsoleMessageActionContext extends ConsoleActionContextBase {
  kind: "message";
  message: ConsoleMessageData;
  index: number;
  messages: readonly ConsoleMessageData[];
}

export type ConsoleContextMenuActionContext =
  | ConsoleSurfaceActionContext
  | ConsoleObjectActionContext
  | ConsoleMessageActionContext;

export type ConsoleActionPredicate<TContext> =
  boolean | ((context: TContext) => boolean);

export type ConsoleActionVariant = "default" | "danger";

/**
 * UI payloads are generic so the core addon SDK does not depend on React.
 * React hosts specialize this type to ReactNode.
 */
export interface ConsoleAction<TContext, TUi = unknown> {
  id: string;
  label: TUi;
  ariaLabel?: string;
  icon?: TUi;
  variant?: ConsoleActionVariant;
  separatorBefore?: boolean;
  visible?: ConsoleActionPredicate<TContext>;
  disabled?: ConsoleActionPredicate<TContext>;
  onSelect: (context: TContext) => void | Promise<void>;
}

export type ConsolePanelAction<TUi = unknown> = ConsoleAction<
  ConsoleSurfaceActionContext,
  TUi
>;

export type ConsoleContextMenuAction<TUi = unknown> = ConsoleAction<
  ConsoleContextMenuActionContext,
  TUi
>;

export type ConsoleMessageAction<TUi = unknown> = ConsoleAction<
  ConsoleMessageActionContext,
  TUi
>;

export interface ConsoleKeyboardShortcutContext {
  readonly mode: ConsoleMode;
  readonly hasMessages: boolean;
  readonly isEmpty: boolean;
}

export interface ConsoleKeyboardShortcut {
  readonly id: string;
  readonly key: string;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly allowInEditable?: boolean;
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
  when?: (context: ConsoleKeyboardShortcutContext) => boolean;
  onTrigger: (context: ConsoleKeyboardShortcutContext) => void | Promise<void>;
}

export type ConsolePanelElementPlacement =
  "header-start" | "header-end" | "before-output" | "after-output" | "footer";

export interface ConsolePanelElementContext {
  readonly mode: ConsoleMode;
  readonly hasMessages: boolean;
  readonly isEmpty: boolean;
}

export interface ConsolePanelElement<TUi = unknown> {
  readonly id: string;
  readonly placement: ConsolePanelElementPlacement;
  render: (context: ConsolePanelElementContext) => TUi | undefined;
}

export type ConsoleMessageDecorationPlacement =
  "gutter" | "before" | "after" | "badge" | "overlay";

export interface ConsoleMessageDecorationContext {
  readonly index: number;
  readonly messages: readonly ConsoleMessageData[];
  readonly placement: ConsoleMessageDecorationPlacement;
}

export interface ConsoleMessageDecoration<TUi = unknown> {
  readonly id: string;
  readonly placement: ConsoleMessageDecorationPlacement;
  match?: (
    message: ConsoleMessageData,
    context: ConsoleMessageDecorationContext,
  ) => boolean;
  render: (
    message: ConsoleMessageData,
    context: ConsoleMessageDecorationContext,
  ) => TUi | undefined;
}

export type ConsoleOutputRendererContext<TUi = unknown> =
  | {
      mode: "console";
      messages: readonly ConsoleMessageData[];
      renderDefault: () => TUi;
    }
  | {
      mode: "ansi";
      entries: readonly (ConsoleStdoutEntry | string)[];
      renderDefault: () => TUi;
    };

export interface ConsoleOutputRenderer<TUi = unknown> {
  mode?: ConsoleMode;
  match?: (context: ConsoleOutputRendererContext<TUi>) => boolean;
  render: (context: ConsoleOutputRendererContext<TUi>) => TUi | undefined;
}

export interface ConsoleFrameDecoratorContext<TUi = unknown> {
  readonly mode: ConsoleMode;
  renderDefault: () => TUi;
}

export interface ConsoleFrameDecorator<TUi = unknown> {
  render: (context: ConsoleFrameDecoratorContext<TUi>) => TUi | undefined;
}

export interface ConsoleEmptyStateRendererContext<TUi = unknown> {
  readonly mode: ConsoleMode;
  readonly hasMessages: boolean;
  readonly message: string;
  renderDefault: () => TUi;
}

export interface ConsoleEmptyStateRenderer<TUi = unknown> {
  readonly mode?: ConsoleMode;
  match?: (context: ConsoleEmptyStateRendererContext<TUi>) => boolean;
  render: (context: ConsoleEmptyStateRendererContext<TUi>) => TUi | undefined;
}

export interface ConsoleMessageTextProviderContext {
  readonly index: number;
  readonly messages: readonly ConsoleMessageData[];
}

export interface ConsoleMessageTextProvider {
  readonly id?: string;
  provideText: (
    message: ConsoleMessageData,
    context: ConsoleMessageTextProviderContext,
  ) => string | readonly string[] | undefined;
}

export interface ConsoleMessageRendererContext<TUi = unknown> {
  index: number;
  messages: readonly ConsoleMessageData[];
  renderDefault: () => TUi;
}

export interface ConsoleMessageRenderer<TUi = unknown> {
  method?: ConsoleMethod;
  match?: (
    message: ConsoleMessageData,
    context: ConsoleMessageRendererContext<TUi>,
  ) => boolean;
  render: (
    message: ConsoleMessageData,
    context: ConsoleMessageRendererContext<TUi>,
  ) => TUi | undefined;
}

export interface ConsoleValueRendererContext<TUi = unknown> {
  propertyKey?: string;
  depth: number;
  type: string;
  renderDefault: () => TUi;
}

export interface ConsoleValueRenderer<TUi = unknown> {
  type?: string;
  match?: (
    value: unknown,
    context: ConsoleValueRendererContext<TUi>,
  ) => boolean;
  render: (
    value: unknown,
    context: ConsoleValueRendererContext<TUi>,
  ) => TUi | undefined;
}

/** Built-in capabilities understood by the standard console host. */
export const consoleCapabilities = Object.freeze({
  react: createConsoleCapability("console.react"),
  dom: createConsoleCapability("console.dom"),
  structuredMessages: createConsoleCapability("console.structuredMessages"),
  processOutput: createConsoleCapability("console.processOutput"),
});

/** Shared service tokens used by console hosts and addons. */
export const consoleServices = Object.freeze({
  viewport:
    createConsoleServiceToken<ConsoleViewportService>("console.viewport"),
  data: createConsoleServiceToken<ConsoleDataService>("console.data"),
});

/** Shared extension-point tokens used by console hosts and addons. */
export const consoleExtensionPoints = Object.freeze({
  processControlParser:
    createConsoleExtensionPoint<ConsoleProcessControlParser>(
      "console.process.control",
    ),
  processOutputProcessor:
    createConsoleExtensionPoint<ConsoleProcessOutputProcessor>(
      "console.process.output",
    ),
  structuredOutputParser:
    createConsoleExtensionPoint<ConsoleStructuredOutputParser>(
      "console.process.structuredOutputParser",
    ),
  linkProvider: createConsoleExtensionPoint<ConsoleLinkProvider>(
    "console.linkProvider",
  ),
  outputRenderer: createConsoleExtensionPoint<ConsoleOutputRenderer>(
    "console.render.output",
  ),
  frameDecorator: createConsoleExtensionPoint<ConsoleFrameDecorator>(
    "console.render.frame",
  ),
  emptyStateRenderer: createConsoleExtensionPoint<ConsoleEmptyStateRenderer>(
    "console.render.emptyState",
  ),
  panelElement: createConsoleExtensionPoint<ConsolePanelElement>(
    "console.render.panelElement",
  ),
  messageFilter: createConsoleExtensionPoint<ConsoleMessageFilter>(
    "console.filter.message",
  ),
  messageRenderer: createConsoleExtensionPoint<ConsoleMessageRenderer>(
    "console.render.message",
  ),
  messageDecoration: createConsoleExtensionPoint<ConsoleMessageDecoration>(
    "console.render.messageDecoration",
  ),
  messageTextProvider: createConsoleExtensionPoint<ConsoleMessageTextProvider>(
    "console.message.text",
  ),
  valueRenderer: createConsoleExtensionPoint<ConsoleValueRenderer>(
    "console.render.value",
  ),
  keyboardShortcut: createConsoleExtensionPoint<ConsoleKeyboardShortcut>(
    "console.keyboard.shortcut",
  ),
  panelAction: createConsoleExtensionPoint<ConsolePanelAction>(
    "console.action.panel",
  ),
  contextMenuAction: createConsoleExtensionPoint<ConsoleContextMenuAction>(
    "console.action.contextMenu",
  ),
  messageAction: createConsoleExtensionPoint<ConsoleMessageAction>(
    "console.action.message",
  ),
});

/** Converts rich JavaScript values into a stable JSON-safe representation. */
export function serializeConsoleValue(
  value: unknown,
  options: { maxDepth?: number; maxEntries?: number } = {},
): unknown {
  const { maxDepth = 8, maxEntries = 100 } = options;
  const seen = new WeakSet<object>();

  const normalize = (input: unknown, depth: number): unknown => {
    if (typeof input === "undefined") {
      return { __moyarichConsoleType: "undefined" };
    }
    if (typeof input === "bigint") {
      return {
        __moyarichConsoleType: "bigint",
        value: input.toString(),
      };
    }
    if (typeof input === "symbol") {
      return {
        __moyarichConsoleType: "symbol",
        description: input.description,
      };
    }
    if (typeof input === "function") {
      return {
        __moyarichConsoleType: "function",
        name: input.name || "anonymous",
      };
    }
    if (typeof input === "number") {
      if (Number.isNaN(input)) return { __moyarichConsoleType: "nan" };
      if (input === Infinity) {
        return { __moyarichConsoleType: "infinity" };
      }
      if (input === -Infinity) {
        return { __moyarichConsoleType: "negative-infinity" };
      }
      if (Object.is(input, -0)) {
        return { __moyarichConsoleType: "negative-zero" };
      }
    }

    if (input === null || typeof input !== "object") {
      return input;
    }

    if (seen.has(input)) return "[Circular]";
    if (depth >= maxDepth) {
      return "[" + (input.constructor?.name || "Object") + "]";
    }

    seen.add(input);

    try {
      if (input instanceof Error) {
        return {
          __moyarichConsoleType: "error",
          name: input.name,
          message: input.message,
          stack: input.stack,
        };
      }
      if (input instanceof Date) {
        return {
          __moyarichConsoleType: "date",
          value: Number.isNaN(input.getTime()) ? null : input.toISOString(),
        };
      }
      if (input instanceof RegExp) {
        return {
          __moyarichConsoleType: "regexp",
          source: input.source,
          flags: input.flags,
        };
      }
      if (input instanceof Map) {
        return {
          __moyarichConsoleType: "map",
          entries: Array.from(input.entries())
            .slice(0, maxEntries)
            .map(([key, item]) => [
              normalize(key, depth + 1),
              normalize(item, depth + 1),
            ]),
        };
      }
      if (input instanceof Set) {
        return {
          __moyarichConsoleType: "set",
          values: Array.from(input.values())
            .slice(0, maxEntries)
            .map((item) => normalize(item, depth + 1)),
        };
      }
      if (input instanceof ArrayBuffer) {
        return {
          __moyarichConsoleType: "array-buffer",
          bytes: Array.from(new Uint8Array(input)).slice(0, maxEntries),
        };
      }
      if (ArrayBuffer.isView(input)) {
        const bytes = Array.from(
          new Uint8Array(input.buffer, input.byteOffset, input.byteLength),
        ).slice(0, maxEntries);

        if (input instanceof DataView) {
          return {
            __moyarichConsoleType: "data-view",
            bytes,
          };
        }

        return {
          __moyarichConsoleType: "typed-array",
          name: input.constructor.name,
          values: Array.from(input as unknown as ArrayLike<unknown>)
            .slice(0, maxEntries)
            .map((item) => normalize(item, depth + 1)),
        };
      }

      const elementCandidate = input as {
        nodeType?: unknown;
        outerHTML?: unknown;
        tagName?: unknown;
      };
      if (
        elementCandidate.nodeType === 1 &&
        typeof elementCandidate.outerHTML === "string"
      ) {
        return {
          __moyarichConsoleType: "html-element",
          tagName: elementCandidate.tagName,
          outerHTML: elementCandidate.outerHTML,
        };
      }

      if (
        input.constructor?.name === "NodeList" &&
        typeof (input as { length?: unknown }).length === "number"
      ) {
        return {
          __moyarichConsoleType: "node-list",
          values: Array.from(input as unknown as ArrayLike<unknown>)
            .slice(0, maxEntries)
            .map((item) => normalize(item, depth + 1)),
        };
      }

      if (Array.isArray(input)) {
        const items = input
          .slice(0, maxEntries)
          .map((item) => normalize(item, depth + 1));

        if (input.length > maxEntries) {
          items.push("[+" + (input.length - maxEntries) + " more]");
        }

        return items;
      }

      const entries = Object.entries(input).slice(0, maxEntries);
      const result = Object.fromEntries(
        entries.map(([key, item]) => [key, normalize(item, depth + 1)]),
      );
      const total = Object.keys(input).length;

      if (total > maxEntries) {
        result["…"] = "[+" + (total - maxEntries) + " more]";
      }

      return result;
    } catch {
      try {
        return String(input);
      } catch {
        return "[Unserializable]";
      }
    } finally {
      seen.delete(input);
    }
  };

  return normalize(value, 0);
}

/** Normalizes a value for readable object-copy output. */
export function normalizeConsoleValue(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (typeof value === "bigint") return String(value) + "n";
  if (typeof value === "function") {
    return "[Function " + (value.name || "anonymous") + "]";
  }
  if (typeof value === "symbol") return String(value);
  if (typeof value === "undefined") return "[undefined]";
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (value instanceof Error) return value.stack || value.message;
  if (seen.has(value)) return "[Circular]";

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => normalizeConsoleValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeConsoleValue(item, seen),
    ]),
  );
}

/** Formats an inspectable object as readable JSON. */
export function formatConsoleObjectForCopy(value: object): string {
  try {
    return JSON.stringify(normalizeConsoleValue(value), null, 2);
  } catch {
    return String(value);
  }
}

/** Clipboard helper shared by browser-hosted addons and the React host. */
export async function writeClipboardText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard access requires a browser environment.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
