import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
export type AddonTranslations = Partial<typeof en>;
const locales: Record<string, AddonTranslations> = { en, es, fr, pt };
export function resolveAddonMessages(
  locale = "en",
  overrides?: AddonTranslations,
): typeof en {
  const tag = locale.replace(/_/g, "-").toLowerCase();
  return {
    ...en,
    ...(locales[tag] ?? locales[tag.split("-")[0]!] ?? {}),
    ...overrides,
  };
}
