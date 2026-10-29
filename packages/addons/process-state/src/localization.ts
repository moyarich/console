import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
export type ProcessStateTranslations = Partial<typeof en>;
const locales: Record<string, ProcessStateTranslations> = { en, es, fr, pt };
export function resolveProcessStateMessages(
  locale = "en",
  overrides?: ProcessStateTranslations,
): typeof en {
  const tag = locale.replace(/_/g, "-").toLowerCase();
  return {
    ...en,
    ...(locales[tag] ?? locales[tag.split("-")[0]!] ?? {}),
    ...overrides,
  };
}
