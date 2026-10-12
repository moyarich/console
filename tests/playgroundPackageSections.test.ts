import { expect, it } from "vitest";
import { createPackageSections } from "../apps/playground/src/playground-registry/createPackageSections";
import type { MdxPageModule } from "../apps/playground/src/content/mdxSection";
const page: MdxPageModule = {
  default: () => null,
  frontmatter: { label: "Page" },
};

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

it("accepts arbitrary collection directories without content-type conventions", () => {
  const sections = createPackageSections(
    {
      "./widget/blog/page.mdx": page,
      "./widget/blog/01-post/page.mdx": page,
      "./widget/docs/01-install/page.mdx": page,
    },
    { "./widget/package.json": { name: "@acme/widget" } },
  );
  expect(sections[0]!.pages.map(({ id }) => id)).toEqual([
    "blog",
    "blog/post",
    "docs/install",
  ]);
});

it("treats a sole arbitrary collection folder as the source root", () => {
  const sections = createPackageSections(
    {
      "./widget/articles/page.mdx": page,
      "./widget/articles/01-intro/page.mdx": page,
    },
    { "./widget/package.json": { name: "@acme/widget" } },
  );
  expect(sections[0]!.pages.map(({ id }) => id)).toEqual(["overview", "intro"]);
});
