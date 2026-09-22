import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONSOLE_CORE_ADDON_ID_PREFIX,
  consoleCapabilities,
  createConsoleAddonManager,
  createConsoleViewportAddon,
  type ConsoleAddon,
  type ConsoleAddonManager,
  type ConsoleDisposable,
  type ConsoleExtensionRegistry,
} from "../addons";
import type { ConsoleMode } from "../types";
import type { ConsoleViewportService } from "../viewport";

const EMPTY_ADDONS: readonly ConsoleAddon[] = [];

function validateAddons(
  addons: readonly ConsoleAddon[],
  coreAddonIds: ReadonlySet<string>,
): void {
  const ids = new Set<string>();

  for (const addon of addons) {
    const id = addon.id.trim();

    if (!id) {
      throw new Error("Addon id must not be empty.");
    }

    if (ids.has(id)) {
      throw new Error(`Console addon "${id}" appears more than once.`);
    }

    if (
      id.startsWith(CONSOLE_CORE_ADDON_ID_PREFIX) &&
      !coreAddonIds.has(id)
    ) {
      throw new Error(
        `Console addon ID "${id}" uses the reserved core namespace "${CONSOLE_CORE_ADDON_ID_PREFIX}".`,
      );
    }

    ids.add(id);
  }
}

function createManager(
  mode: ConsoleMode,
  viewport: ConsoleViewportService,
): ConsoleAddonManager {
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
  const coreAddons = useMemo(
    () => [createConsoleViewportAddon(viewport)] satisfies readonly ConsoleAddon[],
    [viewport],
  );
  const coreAddonIds = useMemo(
    () => new Set(coreAddons.map((addon) => addon.id)),
    [coreAddons],
  );
  const allAddons = useMemo(
    () => [...coreAddons, ...addonList],
    [addonList, coreAddons],
  );
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
    () => allAddons.filter((addon) => !disabledIds.has(addon.id.trim())),
    [allAddons, disabledIds],
  );

  validateAddons(allAddons, coreAddonIds);

  const manager = useMemo(
    () => createManager(mode, viewport),
    [mode, viewport],
  );
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
      activeAddons.map((addon) => [addon.id.trim(), addon]),
    );
    const currentEntries = Array.from(loadedRef.current.entries()).reverse();

    for (const [id, current] of currentEntries) {
      if (nextById.get(id) === current.addon) continue;

      current.registration.dispose();
      loadedRef.current.delete(id);
    }

    for (const addon of activeAddons) {
      const id = addon.id.trim();
      const current = loadedRef.current.get(id);

      if (current?.addon === addon) continue;

      loadedRef.current.set(id, {
        addon,
        registration: manager.load(addon),
      });
    }
  }, [activeAddons, manager]);

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
