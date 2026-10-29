import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  consoleCapabilities,
  consoleServices,
  createConsoleAddonManager,
  type ConsoleAddon,
  type ConsoleAddonManager,
  type ConsoleExtensionRegistry,
} from "../addons";
import type { ConsoleDataService } from "../data";
import type { ConsoleMode } from "../types";
import type { ConsoleViewportService } from "../viewport";

const EMPTY_ADDONS: readonly ConsoleAddon[] = [];

function validateAddons(addons: readonly ConsoleAddon[]): void {
  const ids = new Set<string>();

  for (const addon of addons) {
    const id = addon.id.trim();

    if (!id) {
      throw new Error("Addon id must not be empty.");
    }

    if (ids.has(id)) {
      throw new Error(`Console addon "${id}" appears more than once.`);
    }

    ids.add(id);
  }
}

function createManager(mode: ConsoleMode): ConsoleAddonManager {
  const manager = createConsoleAddonManager({
    capabilities:
      mode === "terminal"
        ? [
            consoleCapabilities.react,
            consoleCapabilities.dom,
            consoleCapabilities.processOutput,
          ]
        : [
            consoleCapabilities.react,
            consoleCapabilities.dom,
            consoleCapabilities.structuredMessages,
          ],
  });

  return manager;
}

/**
 * Activates a controlled addon list and returns the shared extension registry.
 * Addon instances with the same identity remain active when only the array
 * container changes.
 */
export function useConsoleAddons(
  addons: readonly ConsoleAddon[] | undefined,
  disabledAddonIds: readonly string[] | undefined,
  mode: ConsoleMode,
  viewport: ConsoleViewportService,
  data: ConsoleDataService,
  onAddonsReady?: (context: { mode: ConsoleMode; addonIds: readonly string[] }) => void,
  onAddonError?: (error: unknown, addonId: string, phase: "activate" | "dispose") => void,
  onReadyGeneration?: () => void,
  onLifecycleError?: (error: unknown, addonId: string, phase: "activate" | "dispose") => void,
): ConsoleExtensionRegistry {
  const addonList = addons ?? EMPTY_ADDONS;
  const disabledIds = useMemo(
    () =>
      new Set(
        (disabledAddonIds ?? []).map((id) => {
          const normalized = id.trim();

          if (!normalized) {
            throw new Error("Disabled addon id must not be empty.");
          }

          return normalized;
        }),
      ),
    [disabledAddonIds],
  );
  const activeAddons = useMemo(
    () => addonList.filter((addon) => !disabledIds.has(addon.id.trim())),
    [addonList, disabledIds],
  );

  validateAddons(addonList);

  const manager = useMemo(() => createManager(mode), [mode]);
  const loadedRef = useRef(new Map<string, ConsoleAddon>());
  const failedRef = useRef(new Map<string, ConsoleAddon>());
  const readyRef = useRef(onAddonsReady);
  const errorRef = useRef(onAddonError);
  const generationRef = useRef(onReadyGeneration);
  const lifecycleErrorRef = useRef(onLifecycleError);
  generationRef.current = onReadyGeneration;
  lifecycleErrorRef.current = onLifecycleError;
  readyRef.current = onAddonsReady;
  errorRef.current = onAddonError;
  const reportError = useCallback(
    (error: unknown, addonId: string, phase: "activate" | "dispose") => {
      try {
        errorRef.current?.(error, addonId, phase);
      } catch {
        // Observer failures cannot interrupt addon cleanup.
      }
      try {
        lifecycleErrorRef.current?.(error, addonId, phase);
      } catch {
        // Lifecycle error observers must not interrupt cleanup.
      }
    },
    [],
  );
  const [, setRevision] = useState(0);
  const initializedManagers = useRef(new WeakSet<ConsoleAddonManager>());

  useEffect(() => {
    const subscription = manager.extensions.subscribe(() => {
      setRevision((revision) => revision + 1);
    });

    return () => subscription.dispose();
  }, [manager]);

  useEffect(() => {
    const registration = manager.services.provide(
      consoleServices.viewport,
      viewport,
    );

    return () => registration.dispose();
  }, [manager, viewport]);

  useEffect(() => {
    const registration = manager.services.provide(consoleServices.data, data);

    return () => registration.dispose();
  }, [data, manager]);

  useEffect(() => {
    const nextById = new Map(
      activeAddons.map((addon) => [addon.id.trim(), addon]),
    );
    const currentEntries = Array.from(loadedRef.current.entries()).reverse();
    let failedSetChanged = false;
    for (const [id, addon] of failedRef.current) {
      if (nextById.get(id) !== addon) {
        failedRef.current.delete(id);
        failedSetChanged = true;
      }
    }
    const changed =
      failedSetChanged ||
      currentEntries.some(([id, addon]) => nextById.get(id) !== addon) ||
      activeAddons.some((addon) => loadedRef.current.get(addon.id.trim()) !== addon && failedRef.current.get(addon.id.trim()) !== addon) ||
      !initializedManagers.current.has(manager);
    if (!changed) return;

    let succeeded = true;
    for (const [id, current] of currentEntries) {
      if (nextById.get(id) === current) continue;
      loadedRef.current.delete(id);
      try {
        manager.unload(id);
      } catch (error) {
        succeeded = false;
        reportError(error, id, "dispose");
      }
    }

    for (const addon of activeAddons) {
      const id = addon.id.trim();
      if (loadedRef.current.get(id) === addon) continue;
      if (failedRef.current.get(id) === addon) {
        succeeded = false;
        continue;
      }
      try {
        manager.load(addon);
        loadedRef.current.set(id, addon);
      } catch (error) {
        failedRef.current.set(id, addon);
        succeeded = false;
        reportError(error, id, "activate");
      }
    }
    initializedManagers.current.add(manager);
    if (succeeded) {
      try {
        readyRef.current?.({ mode, addonIds: activeAddons.map((addon) => addon.id.trim()) });
      } catch {
        // Client callbacks cannot invalidate a completed reconciliation.
      }
      generationRef.current?.();
    }
  }, [activeAddons, manager, mode, reportError]);

  useEffect(
    () => () => {
      const loadedIds = Array.from(loadedRef.current.keys()).reverse();
      loadedRef.current.clear();
      failedRef.current.clear();
      initializedManagers.current.delete(manager);
      for (const id of loadedIds) {
        try {
          manager.unload(id);
        } catch (error) {
          reportError(error, id, "dispose");
        }
      }
    },
    [manager, reportError],
  );

  return manager.extensions;
}
