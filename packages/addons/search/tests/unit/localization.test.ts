import { describe, expect, it } from "vitest";
import { resolveAddonMessages } from "../../src/localization";

describe("search addon localization", () => {
  it("uses the addon's own dictionaries with regional fallback", () => {
    expect(resolveAddonMessages("es-MX")).toMatchObject(
      resolveAddonMessages("es"),
    );
    expect(resolveAddonMessages("fr-CA")).toMatchObject(
      resolveAddonMessages("fr"),
    );
  });
  it("uses English fallback and supports independent overrides", () => {
    expect(resolveAddonMessages("zz")).toEqual(resolveAddonMessages("en"));
    expect(resolveAddonMessages("en", { next: "Advance" }).next).toBe(
      "Advance",
    );
  });
});
