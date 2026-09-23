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
      | T
      | undefined;
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
