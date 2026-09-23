import { useEffect, useMemo, useRef, useState } from "react";
import {
  consoleCapabilities,
  consoleServices,
  createConsoleAddonManager,
  type ConsoleAddon,
  type ConsoleAddonManager,
  type ConsoleExtensionRegistry,
} from "../addons";
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
      mode === "ansi"
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
  const [, setRevision] = useState(0);

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
    const nextById = new Map(
      activeAddons.map((addon) => [addon.id.trim(), addon]),
    );
    const currentEntries = Array.from(loadedRef.current.entries()).reverse();

    for (const [id, current] of currentEntries) {
      if (nextById.get(id) === current) continue;

      manager.unload(id);
      loadedRef.current.delete(id);
    }

    for (const addon of activeAddons) {
      const id = addon.id.trim();
      const current = loadedRef.current.get(id);

      if (current === addon) continue;

      manager.load(addon);
      loadedRef.current.set(id, addon);
    }
  }, [activeAddons, manager]);

  useEffect(
    () => () => {
      const loadedIds = Array.from(loadedRef.current.keys()).reverse();
      loadedRef.current.clear();

      for (const id of loadedIds) {
        manager.unload(id);
      }
    },
    [manager],
  );

  return manager.extensions;
}
