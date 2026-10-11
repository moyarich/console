import { expect, it } from "vitest";
import { createPackageSections } from "../apps/playground/src/playground-registry/createPackageSections";
import type { MdxPageModule } from "../apps/playground/src/utils/mdxSection";
const page: MdxPageModule = { default: () => null, meta: { label: "Page" } };

it("discovers packages and keeps each package's guides and examples together", () => {
  const sections = createPackageSections(
    {
      "./addons/new-addon/examples/page.mdx": page,
      "./addons/new-addon/examples/01-demo/page.mdx": page,
      "./addons/new-addon/examples/02-api/page.mdx": page,
      "./console/examples/page.mdx": page,
      "./console/examples/01-log/page.mdx": page,
    },
    {
      "./addons/new-addon/package.json": {
        name: "@moyarich/console-addon-new-addon",
      },
      "./console/package.json": { name: "@moyarich/console" },
    },
  );
  expect(sections.map(({ label }) => label)).toEqual([
    "@moyarich/console",
    "@moyarich/console-addon-new-addon",
  ]);
  expect(sections[1]!.pages.map(({ id }) => id)).toEqual([
    "overview",
    "demo",
    "api",
  ]);
});

it("reports missing package metadata", () => {
  expect(() =>
    createPackageSections({ "./new/examples/page.mdx": page }, {}),
  ).toThrow("Missing package metadata");
});

it("sorts all packages by published name without prioritizing console packages", () => {
  const sections = createPackageSections(
    {
      "./console/examples/page.mdx": page,
      "./addons/first/examples/page.mdx": page,
    },
    {
      "./console/package.json": { name: "@moyarich/console" },
      "./addons/first/package.json": { name: "@acme/first" },
    },
  );
  expect(sections.map(({ label }) => label)).toEqual([
    "@acme/first",
    "@moyarich/console",
  ]);
});

it("lists an addon guide beside its examples when no separate docs exist", () => {
  const sections = createPackageSections(
    {
      "./addons/filtering/examples/page.mdx": page,
      "./addons/filtering/examples/01-filtering/page.mdx": page,
    },
    {
      "./addons/filtering/package.json": {
        name: "@moyarich/console-addon-filtering",
      },
    },
  );
  expect(sections[0]!.pages.map(({ id }) => id)).toEqual([
    "overview",
    "filtering",
  ]);
  expect(sections[0]!.items.every((item) => item.type === "page")).toBe(true);
});
