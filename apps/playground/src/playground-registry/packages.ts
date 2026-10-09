import { createMdxSection, type MdxPageModule } from "@src/utils/mdxSection";

export const CONSOLE_PACKAGE_SECTION = createMdxSection({
  id: "package-console",
  label: "@moyarich/console",
  modules: import.meta.glob<MdxPageModule>(
    ["./**/page.mdx", "!./examples/**/page.mdx"],
    {
      base: "../../../../packages/console/docs",
      eager: true,
    },
  ),
});

export const CONSOLE_CORE_PACKAGE_SECTION = createMdxSection({
  id: "package-console-core",
  label: "@moyarich/console-core",
  modules: import.meta.glob<MdxPageModule>(
    ["./**/page.mdx", "!./examples/**/page.mdx"],
    {
      base: "../../../../packages/console-core/docs",
      eager: true,
    },
  ),
});

/** Addon pages grouped by package beneath a single sidebar section. */
export const ADDONS_SECTION = createMdxSection({
  id: "addons",
  label: "Addons",
  modules: Object.fromEntries(
    Object.entries(
      import.meta.glob<MdxPageModule>(
        ["./*/docs/**/page.mdx", "!./*/docs/examples/**/page.mdx"],
        {
          base: "../../../../packages/addons",
          eager: true,
        },
      ),
    ).map(([path, pageModule]) => {
      const [addon, ...pagePath] = path.replace(/^\.\//, "").split("/docs/");
      const relativePagePath = pagePath.join("/docs/");

      // Give each package's root page its own slot inside the addon group.
      const groupedPath =
        relativePagePath === "page.mdx"
          ? "00-overview/page.mdx"
          : relativePagePath;

      return [`./${addon}/${groupedPath}`, pageModule];
    }),
  ),
});
