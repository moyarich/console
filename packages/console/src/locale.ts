import addonEn from "./locales/addons/en.json";
import addonEs from "./locales/addons/es.json";
import addonFr from "./locales/addons/fr.json";

export type ConsoleAddonMessages = typeof addonEn;
export type ConsoleAddonTranslations = Partial<ConsoleAddonMessages>;
const addonLocales: Record<string, ConsoleAddonTranslations> = {
  en: addonEn, es: addonEs, fr: addonFr,
};

/** Addon chrome translation with fallback and optional custom dictionary. */
export function resolveConsoleAddonMessages(locale = "en", overrides?: ConsoleAddonTranslations): ConsoleAddonMessages {
  const tag = locale.replace(/_/g, "-").toLowerCase();
  return {
    ...addonEn,
    ...(addonLocales[tag] ?? addonLocales[tag.split("-")[0]!] ?? {}),
    ...overrides,
  };
}

export function useConsoleAddonMessages(overrides?: ConsoleAddonTranslations): ConsoleAddonMessages {
  const context = useConsoleLocale();
  return resolveConsoleAddonMessages(context.locale, overrides);
}

import { createContext, useContext } from "react";
import type { ConsoleTranslations } from "./localization";

export type ConsoleDirection = "ltr" | "rtl";
export interface ConsoleLocaleOptions {
  locale?: string;
  dir?: ConsoleDirection | "auto";
  translations?: ConsoleTranslations;
}

/** Resolve the display direction from the language subtag, unless explicitly overridden. */
export function resolveConsoleDirection(locale = "en", dir: ConsoleLocaleOptions["dir"] = "auto"): ConsoleDirection {
  if (dir && dir !== "auto") return dir;
  const language = locale.replace(/_/g, "-").split("-")[0]?.toLowerCase();
  return ["ar", "fa", "he", "ur", "ps", "dv", "ku"].includes(language ?? "") ? "rtl" : "ltr";
}

/** Formatting helpers operate on display values only, never the persisted message payload. */
export function createConsoleFormatters(locale = "en") {
  return {
    date(value: Date | number | string, options?: Intl.DateTimeFormatOptions) {
      return new Intl.DateTimeFormat(locale, options).format(
        value instanceof Date ? value : new Date(value),
      );
    },
    number(value: number, options?: Intl.NumberFormatOptions) {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) {
      return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
    },
  };
}

export const ConsoleLocaleContext = createContext<Required<Pick<ConsoleLocaleOptions, "locale">> & ConsoleLocaleOptions>({ locale: "en" });
export function useConsoleLocale() {
  return useContext(ConsoleLocaleContext);
}
