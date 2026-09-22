import { useEffect, useMemo, useRef, useState } from "react";
import {
  consoleCapabilities,
  createConsoleAddonManager,
  type ConsoleAddon,
  type ConsoleAddonManager,
  type ConsoleDisposable,
  type ConsoleExtensionRegistry,
} from "../addons";
import type { ConsoleMode } from "../types";

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
  return createConsoleAddonManager({
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
}

/**
 * Activates a controlled addon list and returns the shared extension registry.
 * Addon instances with the same identity remain active when only the array
 * container changes.
 */
export function useConsoleAddons(
  addons: readonly ConsoleAddon[] | undefined,
  mode: ConsoleMode,
): ConsoleExtensionRegistry {
  const addonList = addons ?? EMPTY_ADDONS;
  validateAddons(addonList);

  const manager = useMemo(() => createManager(mode), [mode]);
  const loadedRef = useRef(
    new Map<
      string,
      {
        addon: ConsoleAddon;
        registration: ConsoleDisposable;
      }
    >(),
  );
  const [, setRevision] = useState(0);

  useEffect(() => {
    const subscription = manager.extensions.subscribe(() => {
      setRevision((revision) => revision + 1);
    });

    return () => subscription.dispose();
  }, [manager]);

  useEffect(() => {
    const nextById = new Map(
      addonList.map((addon) => [addon.id.trim(), addon]),
    );
    const currentEntries = Array.from(loadedRef.current.entries()).reverse();

    for (const [id, current] of currentEntries) {
      if (nextById.get(id) === current.addon) continue;

      current.registration.dispose();
      loadedRef.current.delete(id);
    }

    for (const addon of addonList) {
      const id = addon.id.trim();
      const current = loadedRef.current.get(id);

      if (current?.addon === addon) continue;

      loadedRef.current.set(id, {
        addon,
        registration: manager.load(addon),
      });
    }
  }, [addonList, manager]);

  useEffect(
    () => () => {
      const loaded = Array.from(loadedRef.current.values()).reverse();
      loadedRef.current.clear();

      for (const current of loaded) {
        current.registration.dispose();
      }
    },
    [manager],
  );

  return manager.extensions;
}
