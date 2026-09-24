import { describe, expect, it } from "vitest";
import { languageForPath } from "../apps/playground/src/components/MonacoEditor/languages";

describe("languageForPath", () => {
  it.each([
    ["example.ts", "typescript"],
    ["example.tsx", "typescriptreact"],
    ["example.js", "javascript"],
    ["example.jsx", "javascriptreact"],
    ["example.css", "css"],
    ["example.scss", "scss"],
    ["example.less", "less"],
    ["example.json", "json"],
    ["example.jsonc", "jsonc"],
    ["example.html", "html"],
  ])("maps %s to %s", (path, languageId) => {
    expect(languageForPath(path)).toBe(languageId);
  });

  it("falls back to plaintext", () => {
    expect(languageForPath("README.unknown")).toBe("plaintext");
  });
});
