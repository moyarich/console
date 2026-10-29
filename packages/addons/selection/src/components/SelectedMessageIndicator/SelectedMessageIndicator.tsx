import {
  resolveAddonMessages,
  type AddonTranslations,
} from "../../localization";
/** Default selection indicator. No stylesheet or addon runtime required. */
export function SelectedMessageIndicator({
  locale = "en",
  translations,
}: { locale?: string; translations?: AddonTranslations } = {}) {
  const t = resolveAddonMessages(locale, translations);
  return (
    <span
      aria-label={t.selectedMessage}
      title={t.selected}
      style={{ fontSize: 12, lineHeight: 1 }}
    >
      ●
    </span>
  );
}
