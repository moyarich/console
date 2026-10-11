import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { createPackageSections } from "../apps/playground/src/playground-registry/createPackageSections";
import { resolvePlaygroundPath } from "../apps/playground/src/utils/playgroundRouting";

it("uses canonical package routes for every package documentation link", () => {
  const base = new URL("../packages/", import.meta.url);
  const paths = readdirSync(base, { recursive: true, encoding: "utf8" }).filter(
    (path) => /\/examples\/(?:.*\/)?page\.mdx$/.test(path),
  );
  const modules = Object.fromEntries(
    paths.map((path) => [
      `./${path}`,
      { default: () => null, meta: { label: "Page" } },
    ]),
  );
  const owners = [
    ...new Set(paths.map((path) => path.split("/examples/")[0]!)),
  ];
  const metadata = Object.fromEntries(
    owners.map((owner) => [
      `./${owner}/package.json`,
      JSON.parse(
        readFileSync(new URL(`${owner}/package.json`, base), "utf8"),
      ) as { name: string },
    ]),
  );
  const sections = createPackageSections(modules, metadata);
  expect(
    resolvePlaygroundPath("/package-console/public-api", sections),
  ).toBeUndefined();
  const sourceOwners = new Map<string, string>();
  for (const path of paths) {
    const source = readFileSync(new URL(path, base), "utf8");
    expect(source, path).not.toMatch(/^aliases:/m);
    expect(source, path).not.toContain("declare function");
    for (const [, importPath] of source.matchAll(/from "(.+\.tsx)\?raw"/g)) {
      const file = new URL(importPath!, new URL(path, base));
      expect(
        () => readFileSync(file, "utf8"),
        `${path}: ${importPath}`,
      ).not.toThrow();
      expect(
        sourceOwners.get(file.href),
        `${path} repeats the example from ${sourceOwners.get(file.href)}`,
      ).toBeUndefined();
      sourceOwners.set(file.href, path);
    }

    for (const [, link] of source.matchAll(/\]\(#(\/[^)]+)\)/g)) {
      expect(
        resolvePlaygroundPath(link!, sections),
        `${path}: ${link}`,
      ).toBeDefined();
    }
  }
});
