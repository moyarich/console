import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseConsoleExampleMeta } from "../apps/playground/src/examples/exampleMetadata";

function collectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(path);
    }

    return [path];
  });
}

describe("playground example MDX metadata", () => {
  it("accepts valid exported metadata", () => {
    const metadata = {
      label: "console.log",
      description: "Render standard log messages.",
      futureField: "preserved",
    };

    expect(parseConsoleExampleMeta(metadata, "./example/page.mdx")).toBe(
      metadata,
    );
  });

  it.each([
    [undefined, "Missing meta export"],
    [{ description: "Missing label" }, '"label" must be a non-empty string'],
    [
      { label: "Missing description" },
      '"description" must be a non-empty string',
    ],
    [
      { label: "", description: "Empty label" },
      '"label" must be a non-empty string',
    ],
    [
      { label: "Empty description", description: "" },
      '"description" must be a non-empty string',
    ],
  ])("rejects invalid metadata %#", (metadata, message) => {
    expect(() =>
      parseConsoleExampleMeta(metadata, "./example/page.mdx"),
    ).toThrow(message);
  });

  it("uses page.mdx as the runnable composition source for every example", () => {
    const examplesDirectory = resolve(
      process.cwd(),
      "apps/playground/src/examples",
    );
    const files = collectFiles(examplesDirectory);
    const pageFiles = files.filter((path) => path.endsWith("/page.mdx"));
    const legacyMetadataFiles = files.filter((path) =>
      path.endsWith("/meta.json"),
    );
    const legacyHarnessFiles = files.filter((path) =>
      path.endsWith("/index.tsx"),
    );

    expect(pageFiles.length).toBeGreaterThan(0);
    expect(legacyMetadataFiles).toEqual([]);
    expect(legacyHarnessFiles).toEqual([]);

    for (const pageFile of pageFiles) {
      const source = readFileSync(pageFile, "utf8");
      expect(source).toMatch(/^---\n/);
      expect(source).toContain("\nlabel:");
      expect(source).toContain("\ndescription:");
      expect(source).toContain("\n---");
      expect(source).not.toContain("export const meta");
      expect(source).toContain("?raw");
      expect(source).toContain("<RunnableExample");
      expect(source).toContain("component={");
      expect(source).toContain("source={");
      expect(source).not.toContain("<RunnableExample />");
      expect(source).not.toContain("<Playground />");
    }
  });
});
