import { describe, expect, it } from "vitest";
import {
  createConsoleFormatters,
  resolveConsoleDirection,
} from "../src/locale";
import { consoleLocales, resolveConsoleMessages } from "../src/localization";

describe("console internationalization and localization", () => {
  it("loads JSON dictionaries", () => {
    expect(consoleLocales.es?.title).toBe("Consola");
    expect(resolveConsoleMessages("fr-CA").clear).toBe("Effacer la console");
  });

  it("resolves writing direction and respects overrides", () => {
    expect(resolveConsoleDirection("ar-EG")).toBe("rtl");
    expect(resolveConsoleDirection("he-IL")).toBe("rtl");
    expect(resolveConsoleDirection("en-US")).toBe("ltr");
    expect(resolveConsoleDirection("ar", "ltr")).toBe("ltr");
  });

  it("formats localized values without modifying source data", () => {
    const source = 1234.5;
    const formatters = createConsoleFormatters("de-DE");
    expect(formatters.number(source)).toBe(
      new Intl.NumberFormat("de-DE").format(source),
    );
    expect(source).toBe(1234.5);
  });
});
