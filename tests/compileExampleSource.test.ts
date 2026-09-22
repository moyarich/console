import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileExampleSource } from "../apps/playground/src/components/RunnableExample/compileExampleSource";

// Node cannot execute browser blob modules. Capture their actual source and
// substitute a minimal executable module at the browser import boundary.
async function compileOutput(source: string, name = "example.tsx") {
  const blobs: Blob[] = [];
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return "data:text/javascript,export default function Example() {}";
  });
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  expect(await compileExampleSource(source, name)).toBeTypeOf("function");
  expect(revoke).toHaveBeenCalled();
  const output = blobs[blobs.length - 1];
  if (!output) throw new Error("Compiler did not create a module blob");
  return output.text();
}

afterEach(() => vi.restoreAllMocks());

describe("runnable example browser ESM compilation", () => {
  it("rewrites generated JSX imports and supported source imports", async () => {
    const output = await compileOutput(`
      import React from "react";
      import { Console } from "@moyarich/console";
      import "@moyarich/console/styles.css";
      export { useState } from "react";
      export default function Example() { return <Console />; }
    `);
    expect(output).toContain("jsx as _jsx");
    expect(output).not.toMatch(/(?:from\s*|import\s*)["'](?:react|@moyarich)/);
  });

  it("preserves absolute URLs and computed dynamic imports", async () => {
    const output = await compileOutput(`
      import "https://example.com/module.js";
      export { value } from "https://example.com/exports.js";
      const url = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";
      export const load = () => import(url);
      export const literal = () => import("https://example.com/dynamic.js");
      export const data = () => import("data:text/javascript,export default 1");
      export const blob = () => import("blob:https://example.com/id");
      export const react = () => import("react", { with: {} });
      export default function Example() { return <div />; }
    `);
    expect(output).toContain("import(url)");
    expect(output).toContain('import("https://example.com/dynamic.js")');
    expect(output).toContain('from "https://example.com/exports.js"');
    expect(output).toContain('import "https://example.com/module.js"');
    expect(output).toContain('import("data:text/javascript,export default 1")');
    expect(output).toContain('import("blob:https://example.com/id")');
    expect(output).not.toContain('import("react"');
    expect(output).toContain("with: {}");
  });

  it("ignores erased type-only imports", async () => {
    await compileOutput(`
      import type { Props } from "./types";
      export default function Example(props: Props) { return <div />; }
    `);
  });

  it.each(["unknown-package", "./local.ts", "/local.ts"])(
    "rejects unsupported runtime import %s",
    async (specifier) => {
      await expect(
        compileExampleSource(
          `import ${JSON.stringify(specifier)};`,
          "example.tsx",
        ),
      ).rejects.toThrow(/Unsupported bare import|Relative import/);
    },
  );

  const examples = fileURLToPath(
    new URL("../apps/playground/src/examples/", import.meta.url),
  );
  const files = readdirSync(examples, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith("/example.tsx"));

  it.each(files)(
    "compiles existing example %s without bare runtime imports",
    async (name) => {
      const output = await compileOutput(
        readFileSync(`${examples}/${name}`, "utf8"),
        name,
      );
      expect(output).not.toMatch(
        /(?:from\s*|import\s*)["'](?:react|@moyarich)/,
      );
    },
  );
});
