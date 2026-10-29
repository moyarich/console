import { createContext, useContext } from "react";
import type { ConsoleTranslations } from "./localization";

export type ConsoleDirection = "ltr" | "rtl";
export interface ConsoleLocaleOptions {
  locale?: string;
  dir?: ConsoleDirection | "auto";
  translations?: ConsoleTranslations;
}

/** Resolve the display direction from the language subtag, unless explicitly overridden. */
export function resolveConsoleDirection(
  locale = "en",
  dir: ConsoleLocaleOptions["dir"] = "auto",
): ConsoleDirection {
  if (dir && dir !== "auto") return dir;
  const language = locale.replace(/_/g, "-").split("-")[0]?.toLowerCase();
  return ["ar", "fa", "he", "ur", "ps", "dv", "ku"].includes(language ?? "")
    ? "rtl"
    : "ltr";
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
    relativeTime(
      value: number,
      unit: Intl.RelativeTimeFormatUnit,
      options?: Intl.RelativeTimeFormatOptions,
    ) {
      return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
    },
  };
}

export const ConsoleLocaleContext = createContext<
  Required<Pick<ConsoleLocaleOptions, "locale">> & ConsoleLocaleOptions
>({ locale: "en" });
export function useConsoleLocale() {
  return useContext(ConsoleLocaleContext);
}
