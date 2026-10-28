import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
export type AddonTranslations = Partial<typeof en>;
const locales: Record<string, AddonTranslations> = { en, es, fr };
export function resolveAddonMessages(locale = "en", translations?: AddonTranslations): typeof en {
  const key = locale.replace(/_/g, "-").toLowerCase();
  return { ...en, ...(locales[key] ?? locales[key.split("-")[0]!] ?? {}), ...translations };
}
