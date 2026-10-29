import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
export type DataExportTranslations = Partial<typeof en>;
const dictionaries: Record<string, DataExportTranslations> = { en, es, fr, pt };
export function resolveDataExportMessages(
  locale = "en",
  overrides?: DataExportTranslations,
): typeof en {
  const tag = locale.replace(/_/g, "-").toLowerCase();
  return {
    ...en,
    ...(dictionaries[tag] ?? dictionaries[tag.split("-")[0]!] ?? {}),
    ...overrides,
  };
}
