import { type ReactNode } from "react";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleDataService,
  type ConsoleMessageAction,
  type ConsoleMessageDecoration,
} from "@moyarich/console-core";

export const CONSOLE_SELECTION_ADDON_ID = "@moyarich/console-addon-selection";

export interface ConsoleSelectionState {
  readonly selectedIds: readonly string[];
  readonly anchorId?: string;
}

export interface ConsoleSelectionController {
  getState(): ConsoleSelectionState;
  subscribe(listener: () => void): () => void;
  isSelected(id: string): boolean;
  select(id: string, additive?: boolean): boolean;
  deselect(id: string): boolean;
  toggle(id: string): boolean;
  clear(): void;
  setSelectedIds(ids: readonly string[]): void;
  selectRange(fromId: string, toId: string): readonly string[];
  getVisibleSelectedIds(): readonly string[];
}

export interface ConsoleSelectionAddonOptions {
  controller?: ConsoleSelectionController;
  decoration?: boolean;
  messageAction?: boolean;
}

export interface ConsoleSelectionAddon extends ConsoleAddon {
  readonly controller: ConsoleSelectionController;
}

export const consoleSelectionService =
  createConsoleServiceToken<ConsoleSelectionController>(
    `${CONSOLE_SELECTION_ADDON_ID}.controller`,
  );

function normalizeId(value: string): string | undefined {
  const normalized = value.trim();
  return normalized || undefined;
}

function uniqueIds(ids: readonly string[]): readonly string[] {
  return Object.freeze(
    Array.from(
      new Set(ids.map((id) => normalizeId(id)).filter(Boolean) as string[]),
    ),
  );
}

function snapshotIds(data: ConsoleDataService | undefined): readonly string[] {
  const snapshot = data?.getSnapshot();
  if (!snapshot) return [];

  if (snapshot.mode === "console") {
    return snapshot.visible.flatMap((message) =>
      message.id ? [message.id] : [],
    );
  }

  return snapshot.visible.flatMap(({ entry }) => (entry.id ? [entry.id] : []));
}

export function createConsoleSelectionController(
  getData: () => ConsoleDataService | undefined = () => undefined,
): ConsoleSelectionController {
  let state: ConsoleSelectionState = Object.freeze({
    selectedIds: Object.freeze([]),
  });
  const listeners = new Set<() => void>();

  const update = (selectedIds: readonly string[], anchorId?: string) => {
    state = Object.freeze({
      selectedIds: uniqueIds(selectedIds),
      ...(anchorId ? { anchorId } : {}),
    });
    for (const listener of listeners) listener();
  };

  const controller: ConsoleSelectionController = {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    isSelected(id) {
      const normalized = normalizeId(id);
      return Boolean(normalized && state.selectedIds.includes(normalized));
    },

    select(id, additive = false) {
      const normalized = normalizeId(id);
      if (!normalized) return false;

      const next = additive
        ? uniqueIds([...state.selectedIds, normalized])
        : [normalized];

      const changed =
        next.length !== state.selectedIds.length ||
        next.some((value, index) => value !== state.selectedIds[index]);

      if (changed || state.anchorId !== normalized) {
        update(next, normalized);
      }

      return changed;
    },

    deselect(id) {
      const normalized = normalizeId(id);
      if (!normalized || !state.selectedIds.includes(normalized)) return false;

      const next = state.selectedIds.filter((value) => value !== normalized);
      update(next, state.anchorId === normalized ? undefined : state.anchorId);
      return true;
    },

    toggle(id) {
      const normalized = normalizeId(id);
      if (!normalized) return false;

      if (controller.isSelected(normalized)) {
        controller.deselect(normalized);
        return false;
      }

      controller.select(normalized, true);
      return true;
    },

    clear() {
      if (state.selectedIds.length === 0 && !state.anchorId) return;
      update([]);
    },

    setSelectedIds(ids) {
      const next = uniqueIds(ids);
      update(next, next.at(-1));
    },

    selectRange(fromId, toId) {
      const ordered = snapshotIds(getData());
      const start = ordered.indexOf(fromId);
      const end = ordered.indexOf(toId);

      if (start < 0 || end < 0) return state.selectedIds;

      const [from, to] = start <= end ? [start, end] : [end, start];
      const range = ordered.slice(from, to + 1);
      update(range, toId);
      return range;
    },

    getVisibleSelectedIds() {
      const visible = new Set(snapshotIds(getData()));
      return Object.freeze(state.selectedIds.filter((id) => visible.has(id)));
    },
  };

  return controller;
}

function createDecoration(
  controller: ConsoleSelectionController,
): ConsoleMessageDecoration<ReactNode> {
  return {
    id: `${CONSOLE_SELECTION_ADDON_ID}:selected`,
    placement: "gutter",
    match({ message }) {
      return Boolean(message.id && controller.isSelected(message.id));
    },
    render({ message }) {
      if (!message.id || !controller.isSelected(message.id)) return undefined;

      return (
        <span
          aria-label="Selected message"
          title="Selected"
          style={{ fontSize: 12, lineHeight: 1 }}
        >
          ●
        </span>
      );
    },
  };
}

function createMessageAction(
  controller: ConsoleSelectionController,
): ConsoleMessageAction<ReactNode> {
  return {
    id: `${CONSOLE_SELECTION_ADDON_ID}:toggle`,
    label: "Toggle selection",
    ariaLabel: "Toggle message selection",
    visible({ message }) {
      return Boolean(message.id);
    },
    onSelect({ message }) {
      if (message.id) controller.toggle(message.id);
    },
  };
}

export function createConsoleSelectionAddon(
  options: ConsoleSelectionAddonOptions = {},
): ConsoleSelectionAddon {
  let activeData: ConsoleDataService | undefined;
  const controller =
    options.controller ?? createConsoleSelectionController(() => activeData);
  const withDecoration = options.decoration !== false;
  const withMessageAction = options.messageAction !== false;

  return {
    id: CONSOLE_SELECTION_ADDON_ID,
    controller,

    activate(host) {
      activeData = host.services.get(consoleServices.data);
      host.services.provide(consoleSelectionService, controller);

      let decorationRegistration:
        ReturnType<typeof host.extensions.register> | undefined;
      let actionRegistration:
        ReturnType<typeof host.extensions.register> | undefined;

      const registerContributions = () => {
        decorationRegistration?.dispose();
        actionRegistration?.dispose();

        if (withDecoration) {
          decorationRegistration = host.extensions.register(
            consoleExtensionPoints.messageDecoration,
            createDecoration(controller),
            { id: `${CONSOLE_SELECTION_ADDON_ID}:selected` },
          );
        }

        if (withMessageAction) {
          actionRegistration = host.extensions.register(
            consoleExtensionPoints.messageAction,
            createMessageAction(controller),
            { id: `${CONSOLE_SELECTION_ADDON_ID}:toggle` },
          );
        }
      };

      registerContributions();
      host.scope.defer(controller.subscribe(registerContributions));
      host.scope.defer(() => decorationRegistration?.dispose());
      host.scope.defer(() => actionRegistration?.dispose());

      return () => {
        activeData = undefined;
      };
    },
  };
}
