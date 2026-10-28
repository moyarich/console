import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
export type AddonMessages = typeof en;
export type AddonTranslations = Partial<AddonMessages>;
const dictionaries: Record<string, AddonTranslations> = { en, es, fr };
export function resolveAddonMessages(locale = "en", overrides?: AddonTranslations): AddonMessages {
  const tag = locale.replace(/_/g, "-").toLowerCase();
  return { ...en, ...(dictionaries[tag] ?? dictionaries[tag.split("-")[0]!] ?? {}), ...overrides };
}
