import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleDataService,
  type ConsoleKeyboardShortcut,
  type ConsoleMessageData,
  type ConsoleViewportService,
} from "@moyarich/console-core";

export const CONSOLE_NAVIGATION_ADDON_ID = "@moyarich/console-addon-navigation";

export type ConsoleNavigationKind = "error" | "warning" | "annotated";
export type ConsoleNavigationDirection = "next" | "previous";
export type ConsoleNavigationBoundary = "start" | "end" | null;

export interface ConsoleNavigationState {
  readonly currentTargetId?: string;
  readonly kind?: ConsoleNavigationKind;
  readonly boundary: ConsoleNavigationBoundary;
}

export interface ConsoleNavigationController {
  getState(): ConsoleNavigationState;
  subscribe(listener: () => void): () => void;
  jumpToMessage(id: string): boolean;
  navigate(
    kind: ConsoleNavigationKind,
    direction: ConsoleNavigationDirection,
  ): string | undefined;
  nextError(): string | undefined;
  previousError(): string | undefined;
  nextWarning(): string | undefined;
  previousWarning(): string | undefined;
  nextAnnotated(): string | undefined;
  previousAnnotated(): string | undefined;
  reset(): void;
}

export interface ConsoleNavigationAddonOptions {
  keyboardShortcuts?: boolean;
}

export interface ConsoleNavigationAddon extends ConsoleAddon {
  readonly controller: ConsoleNavigationController;
}

interface ConsoleAnnotationsLookup {
  getAnnotatedMessageIds(): readonly string[];
}

const annotationLookupService =
  createConsoleServiceToken<ConsoleAnnotationsLookup>(
    "@moyarich/console-addon-annotations.controller",
  );

export const consoleNavigationService =
  createConsoleServiceToken<ConsoleNavigationController>(
    `${CONSOLE_NAVIGATION_ADDON_ID}.controller`,
  );

interface ConsoleNavigationDependencies {
  getData(): ConsoleDataService | undefined;
  getViewport(): ConsoleViewportService | undefined;
  getAnnotations(): ConsoleAnnotationsLookup | undefined;
}

function messageMatches(
  message: ConsoleMessageData,
  kind: ConsoleNavigationKind,
  annotations: ReadonlySet<string>,
): boolean {
  if (!message.id) return false;
  if (kind === "error") return message.method === "error";
  if (kind === "warning") {
    return message.method === "warn" || message.method === "assert";
  }
  return annotations.has(message.id);
}

export function createConsoleNavigationController(
  dependencies: ConsoleNavigationDependencies,
): ConsoleNavigationController {
  let state: ConsoleNavigationState = Object.freeze({ boundary: null });
  const listeners = new Set<() => void>();

  const update = (next: ConsoleNavigationState) => {
    state = Object.freeze(next);
    for (const listener of listeners) listener();
  };

  const getVisibleMessages = (): readonly ConsoleMessageData[] => {
    const snapshot = dependencies.getData()?.getSnapshot();
    return snapshot?.mode === "console" ? snapshot.visible : [];
  };

  const controller: ConsoleNavigationController = {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    jumpToMessage(id) {
      const normalized = id.trim();
      if (!normalized) return false;

      const visible = getVisibleMessages();
      if (!visible.some((message) => message.id === normalized)) return false;

      const scrolled =
        dependencies.getViewport()?.scrollToMessage(normalized, {
          block: "nearest",
        }) ?? false;

      if (scrolled) {
        update({ currentTargetId: normalized, boundary: null });
      }

      return scrolled;
    },

    navigate(kind, direction) {
      const annotations = new Set(
        dependencies.getAnnotations()?.getAnnotatedMessageIds() ?? [],
      );
      const candidates = getVisibleMessages().filter((message) =>
        messageMatches(message, kind, annotations),
      );
      const ids = candidates.flatMap((message) =>
        message.id ? [message.id] : [],
      );

      if (ids.length === 0) {
        update({
          currentTargetId: state.currentTargetId,
          kind,
          boundary: direction === "next" ? "end" : "start",
        });
        return undefined;
      }

      const currentIndex = state.currentTargetId
        ? ids.indexOf(state.currentTargetId)
        : -1;
      const targetIndex =
        direction === "next"
          ? currentIndex < 0
            ? 0
            : currentIndex + 1
          : currentIndex < 0
            ? ids.length - 1
            : currentIndex - 1;

      if (targetIndex < 0 || targetIndex >= ids.length) {
        update({
          currentTargetId: state.currentTargetId,
          kind,
          boundary: direction === "next" ? "end" : "start",
        });
        return undefined;
      }

      const targetId = ids[targetIndex]!;
      const scrolled =
        dependencies.getViewport()?.scrollToMessage(targetId, {
          block: "nearest",
        }) ?? false;

      if (!scrolled) return undefined;

      update({ currentTargetId: targetId, kind, boundary: null });
      return targetId;
    },

    nextError() {
      return controller.navigate("error", "next");
    },
    previousError() {
      return controller.navigate("error", "previous");
    },
    nextWarning() {
      return controller.navigate("warning", "next");
    },
    previousWarning() {
      return controller.navigate("warning", "previous");
    },
    nextAnnotated() {
      return controller.navigate("annotated", "next");
    },
    previousAnnotated() {
      return controller.navigate("annotated", "previous");
    },

    reset() {
      update({ boundary: null });
    },
  };

  return controller;
}

function createShortcuts(
  controller: ConsoleNavigationController,
): readonly ConsoleKeyboardShortcut[] {
  return [
    {
      id: `${CONSOLE_NAVIGATION_ADDON_ID}:next-error`,
      key: "F8",
      preventDefault: true,
      when: ({ mode }) => mode === "console",
      onTrigger: () => {
        controller.nextError();
      },
    },
    {
      id: `${CONSOLE_NAVIGATION_ADDON_ID}:previous-error`,
      key: "F8",
      shiftKey: true,
      preventDefault: true,
      when: ({ mode }) => mode === "console",
      onTrigger: () => {
        controller.previousError();
      },
    },
    {
      id: `${CONSOLE_NAVIGATION_ADDON_ID}:next-warning`,
      key: "ArrowDown",
      altKey: true,
      preventDefault: true,
      when: ({ mode }) => mode === "console",
      onTrigger: () => {
        controller.nextWarning();
      },
    },
    {
      id: `${CONSOLE_NAVIGATION_ADDON_ID}:previous-warning`,
      key: "ArrowUp",
      altKey: true,
      preventDefault: true,
      when: ({ mode }) => mode === "console",
      onTrigger: () => {
        controller.previousWarning();
      },
    },
  ];
}

export function createConsoleNavigationAddon(
  options: ConsoleNavigationAddonOptions = {},
): ConsoleNavigationAddon {
  let activeHost:
    | {
        services: {
          get<T>(token: { readonly id: string }): T | undefined;
        };
      }
    | undefined;

  const controller = createConsoleNavigationController({
    getData: () =>
      activeHost?.services.get<ConsoleDataService>(consoleServices.data),
    getViewport: () =>
      activeHost?.services.get<ConsoleViewportService>(
        consoleServices.viewport,
      ),
    getAnnotations: () =>
      activeHost?.services.get<ConsoleAnnotationsLookup>(
        annotationLookupService,
      ),
  });

  return {
    id: CONSOLE_NAVIGATION_ADDON_ID,
    controller,

    activate(host) {
      activeHost = host;
      host.services.provide(consoleNavigationService, controller);

      if (options.keyboardShortcuts !== false) {
        for (const shortcut of createShortcuts(controller)) {
          host.extensions.register(
            consoleExtensionPoints.keyboardShortcut,
            shortcut,
            { id: shortcut.id },
          );
        }
      }

      return () => {
        activeHost = undefined;
      };
    },
  };
}
