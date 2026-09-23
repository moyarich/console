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
      import { GripVertical } from "lucide-react";
      export { useState } from "react";
      export default function Example() {
        return <Console actions={<GripVertical />} />;
      }
    `);
    expect(output).toContain("jsx as _jsx");
    expect(output).not.toMatch(
      /(?:from\s*|import\s*)["'](?:react|@moyarich|lucide-react)/,
    );
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
});
