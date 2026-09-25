import { describe, expect, it } from "vitest";
import { languageForPath } from "../packages/playground/src/components/MonacoEditor/languages";

describe("languageForPath", () => {
  it.each([
    ["example.ts", "typescript"],
    ["example.tsx", "typescript"],
    ["example.js", "javascript"],
    ["example.jsx", "javascript"],
    ["example.css", "css"],
    ["example.scss", "scss"],
    ["example.less", "less"],
    ["example.json", "json"],
    ["example.jsonc", "json"],
    ["example.html", "html"],
    ["main.py", "python"],
    ["types.pyi", "python"],
    ["app.pyw", "python"],
    ["Main.java", "java"],
    ["Main.jav", "java"],
    ["src/MAIN.PY?raw#source", "python"],
    ["src/MAIN.JAVA#source", "java"],
  ])("maps %s to %s", (path, languageId) => {
    expect(languageForPath(path)).toBe(languageId);
  });

  it("falls back to plaintext", () => {
    expect(languageForPath("README.unknown")).toBe("plaintext");
  });
});
