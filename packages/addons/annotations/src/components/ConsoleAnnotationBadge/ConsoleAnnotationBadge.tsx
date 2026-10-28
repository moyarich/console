import { resolveAddonMessages, type AddonTranslations } from "../../localization";
import { useSyncExternalStore } from "react";
import type {
  ConsoleAnnotation,
  ConsoleAnnotationsController,
} from "../../index";

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
  locale = "en",
  translations,
}: {
  controller: ConsoleAnnotationsController;
  messageId: string;
  locale?: string;
  translations?: AddonTranslations;
}) {
  const annotations = useAnnotations(controller, messageId);
  const labels = resolveAddonMessages(locale, translations);
  if (annotations.length === 0) return null;

  const label = annotations
    .map((annotation) => annotation.label ?? annotation.id)
    .join(", ");

  return (
    <span
      aria-label={`${labels.annotations}: ${label}`}
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
