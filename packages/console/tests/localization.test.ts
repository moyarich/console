import { describe, expect, it } from "vitest";
import { englishConsoleMessages, resolveConsoleMessages } from "../src/localization";

describe("console localization", () => {
  it("defaults to English", () => {
    expect(resolveConsoleMessages()).toEqual(englishConsoleMessages);
  });
  it("matches regional locales through their primary language", () => {
    expect(resolveConsoleMessages("es-MX").clear).toBe("Limpiar consola");
    expect(resolveConsoleMessages("fr-CA").copyObject).toBe("Copier l'objet");
  });
  it("falls back to English for unsupported locales", () => {
    expect(resolveConsoleMessages("de-DE")).toEqual(englishConsoleMessages);
  });
  it("applies overrides after locale fallback", () => {
    expect(resolveConsoleMessages("es", { clear: "Borrar" }).clear).toBe("Borrar");
    expect(resolveConsoleMessages("es", { clear: "Borrar" }).actions).toBe("Acciones de la consola");
  });
});
