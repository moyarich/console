import { describe, expect, it } from "vitest";
import { resolveDataExportMessages } from "../../src/localization";

describe("data-export addon localization", () => {
  it("supports en, es, fr, pt and regional variants", () => {
    for (const locale of ["en", "es", "fr", "pt"]) {
      expect(resolveDataExportMessages(locale + "-XX")).toEqual(resolveDataExportMessages(locale));
    }
  });
  it("supports custom translations and unknown-language fallback", () => {
    expect(resolveDataExportMessages("xx")).toEqual(resolveDataExportMessages("en"));
    expect(resolveDataExportMessages("pt-BR", { copyJson: "JSON personalizado" }).copyJson).toBe("JSON personalizado");
  });
});
