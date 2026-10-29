import { describe, expect, it } from "vitest";
import { resolveProcessStateMessages } from "../../src/localization";

describe("process-state addon localization", () => {
  it("supports all built-in languages and region fallback", () => {
    for (const lang of ["en", "es", "fr", "pt"]) {
      expect(resolveProcessStateMessages(lang)).toEqual(
        resolveProcessStateMessages(lang + "-XX"),
      );
    }
  });
  it("uses English fallback and permits custom translation strings", () => {
    expect(resolveProcessStateMessages("xx")).toEqual(
      resolveProcessStateMessages("en"),
    );
    expect(resolveProcessStateMessages("en", { working: "Busy" }).working).toBe(
      "Busy",
    );
  });
});
