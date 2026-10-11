import { expect, it } from "vitest";
import { createPackageSections } from "../apps/playground/src/playground-registry/createPackageSections";
import { createPackageNavigation } from "../apps/playground/src/playground-registry/packageNavigation";

it("groups packages by directory rather than package-name prefixes", () => {
  const page = { default: () => null, meta: { label: "Guide" } };
  const sections = createPackageSections(
    {
      "./addons/annotations/examples/page.mdx": page,
      "./console/examples/page.mdx": page,
    },
    {
      "./addons/annotations/package.json": {
        name: "@moyarich/console-addon-annotations",
      },
      "./console/package.json": { name: "@moyarich/console" },
    },
  );
  const tree = createPackageNavigation(sections);
  expect(tree[0]!.type).toBe("package");
  expect(tree[1]).toMatchObject({
    type: "directory",
    id: "addons",
    label: "Addons",
    items: [
      {
        type: "package",
        section: { label: "@moyarich/console-addon-annotations" },
      },
    ],
  });
});
