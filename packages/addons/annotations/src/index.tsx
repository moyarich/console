import { useSyncExternalStore, type ReactNode } from "react";
import {
  consoleExtensionPoints,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleMessageAction,
  type ConsoleMessageData,
  type ConsoleMessageDecoration,
} from "@moyarich/console-core";

/** Stable package-qualified identity for the annotations addon. */
export const CONSOLE_ANNOTATIONS_ADDON_ID =
  "@moyarich/console-addon-annotations";

/** Built-in annotation identifier used by the default bookmark UI. */
export const CONSOLE_BOOKMARK_ANNOTATION_ID = "bookmark";

/** One host-owned annotation associated with a stable Console message ID. */
export interface ConsoleAnnotation {
  readonly id: string;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Observable annotation state kept separate from source Console messages. */
export interface ConsoleAnnotationsController {
  /** Immutable snapshot, stable until this message's annotations change. */
  getAnnotations(messageId: string): readonly ConsoleAnnotation[];
  getAnnotatedMessageIds(): readonly string[];
  hasAnnotation(messageId: string, annotationId: string): boolean;
  addAnnotation(messageId: string, annotation: ConsoleAnnotation): boolean;
  removeAnnotation(messageId: string, annotationId: string): boolean;
  toggleAnnotation(messageId: string, annotation?: ConsoleAnnotation): boolean;
  clearMessage(messageId: string): boolean;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export interface ConsoleAnnotationsAddonOptions {
  /** Reuse host-owned annotation state. */
  controller?: ConsoleAnnotationsController;
  /** Register the default badge decoration. @default true */
  decoration?: boolean;
  /** Register the default bookmark message action. @default true */
  bookmarkAction?: boolean;
}

export interface ConsoleAnnotationsAddon extends ConsoleAddon {
  readonly controller: ConsoleAnnotationsController;
}

/** Service token exposed while the annotations addon is active. */
export const consoleAnnotationsService =
  createConsoleServiceToken<ConsoleAnnotationsController>(
    `${CONSOLE_ANNOTATIONS_ADDON_ID}.controller`,
  );

const EMPTY_ANNOTATIONS: readonly ConsoleAnnotation[] = Object.freeze([]);

const DEFAULT_BOOKMARK: ConsoleAnnotation = Object.freeze({
  id: CONSOLE_BOOKMARK_ANNOTATION_ID,
  label: "Bookmark",
});

function normalizeId(value: string): string | undefined {
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeAnnotation(
  annotation: ConsoleAnnotation,
): ConsoleAnnotation | undefined {
  const id = normalizeId(annotation.id);
  if (!id) return undefined;

  return Object.freeze({
    id,
    ...(annotation.label ? { label: annotation.label } : {}),
    ...(annotation.metadata
      ? { metadata: Object.freeze({ ...annotation.metadata }) }
      : {}),
  });
}

/** Creates observable, headless annotation state keyed by stable message ID. */
export function createConsoleAnnotationsController(): ConsoleAnnotationsController {
  const annotations = new Map<string, Map<string, ConsoleAnnotation>>();
  const snapshots = new Map<string, readonly ConsoleAnnotation[]>();
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const controller: ConsoleAnnotationsController = {
    getAnnotations(messageId) {
      const id = normalizeId(messageId);
      if (!id || !annotations.has(id)) return EMPTY_ANNOTATIONS;
      let snapshot = snapshots.get(id);
      if (!snapshot) {
        snapshot = Object.freeze(Array.from(annotations.get(id)!.values()));
        snapshots.set(id, snapshot);
      }
      return snapshot;
    },

    getAnnotatedMessageIds() {
      return Object.freeze(
        Array.from(annotations.entries())
          .filter(([, values]) => values.size > 0)
          .map(([messageId]) => messageId),
      );
    },

    hasAnnotation(messageId, annotationId) {
      const messageKey = normalizeId(messageId);
      const annotationKey = normalizeId(annotationId);
      if (!messageKey || !annotationKey) return false;
      return annotations.get(messageKey)?.has(annotationKey) ?? false;
    },

    addAnnotation(messageId, annotation) {
      const messageKey = normalizeId(messageId);
      const normalized = normalizeAnnotation(annotation);
      if (!messageKey || !normalized) return false;

      const current = annotations.get(messageKey) ?? new Map();
      const previous = current.get(normalized.id);

      if (
        previous &&
        previous.label === normalized.label &&
        previous.metadata === normalized.metadata
      ) {
        return false;
      }

      current.set(normalized.id, normalized);
      annotations.set(messageKey, current);
      snapshots.delete(messageKey);
      emit();
      return true;
    },

    removeAnnotation(messageId, annotationId) {
      const messageKey = normalizeId(messageId);
      const annotationKey = normalizeId(annotationId);
      if (!messageKey || !annotationKey) return false;

      const current = annotations.get(messageKey);
      if (!current?.delete(annotationKey)) return false;

      if (current.size === 0) annotations.delete(messageKey);
      snapshots.delete(messageKey);
      emit();
      return true;
    },

    toggleAnnotation(messageId, annotation = DEFAULT_BOOKMARK) {
      const normalized = normalizeAnnotation(annotation);
      if (!normalized) return false;

      if (controller.hasAnnotation(messageId, normalized.id)) {
        controller.removeAnnotation(messageId, normalized.id);
        return false;
      }

      controller.addAnnotation(messageId, normalized);
      return true;
    },

    clearMessage(messageId) {
      const messageKey = normalizeId(messageId);
      if (!messageKey || !annotations.delete(messageKey)) return false;
      snapshots.delete(messageKey);
      emit();
      return true;
    },

    clear() {
      if (annotations.size === 0) return;
      annotations.clear();
      snapshots.clear();
      emit();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return controller;
}

function useAnnotations(
  controller: ConsoleAnnotationsController,
  messageId: string,
): readonly ConsoleAnnotation[] {
  return useSyncExternalStore(
    controller.subscribe,
    () => controller.getAnnotations(messageId),
    () => controller.getAnnotations(messageId),
  );
}

/** Default bookmark/annotation badge rendered through messageDecoration. */
export function ConsoleAnnotationBadge({
  controller,
  messageId,
}: {
  controller: ConsoleAnnotationsController;
  messageId: string;
}) {
  const annotations = useAnnotations(controller, messageId);
  if (annotations.length === 0) return null;

  const label = annotations
    .map((annotation) => annotation.label ?? annotation.id)
    .join(", ");

  return (
    <span
      aria-label={`Annotations: ${label}`}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">★</span>
      {annotations.length > 1 ? (
        <span aria-hidden="true">{annotations.length}</span>
      ) : null}
    </span>
  );
}

function createDecoration(
  controller: ConsoleAnnotationsController,
): ConsoleMessageDecoration<ReactNode> {
  return {
    id: `${CONSOLE_ANNOTATIONS_ADDON_ID}:decoration`,
    placement: "badge",
    match({ message }) {
      return Boolean(
        message.id && controller.getAnnotations(message.id).length > 0,
      );
    },
    render({ message }) {
      if (!message.id) return undefined;
      return (
        <ConsoleAnnotationBadge
          controller={controller}
          messageId={message.id}
        />
      );
    },
  };
}

function createBookmarkAction(
  controller: ConsoleAnnotationsController,
): ConsoleMessageAction<ReactNode> {
  return {
    id: `${CONSOLE_ANNOTATIONS_ADDON_ID}:bookmark`,
    label: "Toggle bookmark",
    ariaLabel: "Toggle message bookmark",
    visible({ message }) {
      return Boolean(message.id);
    },
    onSelect({ message }) {
      if (!message.id) return;
      controller.toggleAnnotation(message.id);
    },
  };
}

/** Creates the first-party annotations/bookmarks addon. */
export function createConsoleAnnotationsAddon(
  options: ConsoleAnnotationsAddonOptions = {},
): ConsoleAnnotationsAddon {
  const controller = options.controller ?? createConsoleAnnotationsController();
  const withDecoration = options.decoration !== false;
  const withBookmarkAction = options.bookmarkAction !== false;

  return {
    id: CONSOLE_ANNOTATIONS_ADDON_ID,
    controller,

    activate(host) {
      host.services.provide(consoleAnnotationsService, controller);

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
            { id: `${CONSOLE_ANNOTATIONS_ADDON_ID}:decoration` },
          );
        }

        if (withBookmarkAction) {
          actionRegistration = host.extensions.register(
            consoleExtensionPoints.messageAction,
            createBookmarkAction(controller),
            { id: `${CONSOLE_ANNOTATIONS_ADDON_ID}:bookmark` },
          );
        }
      };

      registerContributions();
      host.scope.defer(controller.subscribe(registerContributions));
      host.scope.defer(() => decorationRegistration?.dispose());
      host.scope.defer(() => actionRegistration?.dispose());
    },
  };
}

/** Utility for hosts that need the annotation state for one message. */
export function getConsoleMessageAnnotations(
  controller: ConsoleAnnotationsController,
  message: Pick<ConsoleMessageData, "id">,
): readonly ConsoleAnnotation[] {
  return message.id ? controller.getAnnotations(message.id) : [];
}
