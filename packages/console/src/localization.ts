import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";

/** Localizable chrome strings; message payloads are never translated. */
export interface ConsoleMessages {
  title: string;
  actions: string;
  copyObject: string;
  copyOutput: string;
  clear: string;
  consoleSubtitle: string;
  terminalSubtitle: string;
  emptyConsole: string;
  emptyTerminal: string;
}

export type ConsoleTranslations = Partial<ConsoleMessages>;
export const englishConsoleMessages: Readonly<ConsoleMessages> = Object.freeze(en);

export const consoleLocales: Readonly<Record<string, ConsoleTranslations>> = Object.freeze({
  en,
  es,
  fr,
  pt,
});

/** Prefer a full BCP 47 language tag, then its primary language, then English. */
export function resolveConsoleMessages(
  locale = "en",
  overrides?: ConsoleTranslations,
): ConsoleMessages {
  const normalized = locale.replace(/_/g, "-").toLowerCase();
  return {
    ...englishConsoleMessages,
    ...(consoleLocales[normalized] ?? consoleLocales[normalized.split("-")[0]!] ?? {}),
    ...overrides,
  };
}
