import { describe, expect, it } from "vitest";
import { resolveAddonMessages } from "../../src/localization";

describe("imperative-scrolling localization", () => {
  it("resolves locale, regional fallback and host overrides", () => {
    expect(resolveAddonMessages("es-MX")).toEqual(resolveAddonMessages("es"));
    expect(resolveAddonMessages("fr-CA")).toEqual(resolveAddonMessages("fr"));
    expect(resolveAddonMessages("xx-YY")).toEqual(resolveAddonMessages("en"));
  });
});
