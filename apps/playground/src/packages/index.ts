import { createMdxSection, type MdxPageModule } from "../utils/mdxSection";

function packageSection(
  id: string,
  label: string,
  modules: Record<string, MdxPageModule>,
  sourcePrefix: string,
) {
  return createMdxSection({
    id,
    label,
    modules: Object.fromEntries(
      Object.entries(modules).map(([path, pageModule]) => [
        `./${path.slice(sourcePrefix.length)}`,
        pageModule,
      ]),
    ),
  });
}

export const CONSOLE_PACKAGE_SECTION = packageSection(
  "package-console",
  "@moyarich/console",
  import.meta.glob("../../../../packages/console/docs/page.mdx", {
    eager: true,
  }) as Record<string, MdxPageModule>,
  "../../../../packages/console/docs/",
);

export const CONSOLE_CORE_PACKAGE_SECTION = packageSection(
  "package-console-core",
  "@moyarich/console-core",
  import.meta.glob("../../../../packages/console-core/docs/**/page.mdx", {
    eager: true,
  }) as Record<string, MdxPageModule>,
  "../../../../packages/console-core/docs/",
);

export const ADDON_PACKAGE_SECTIONS = [
  packageSection(
    "package-addon-annotations",
    "Annotations",
    import.meta.glob(
      "../../../../packages/addons/annotations/docs/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/annotations/docs/",
  ),
  packageSection(
    "package-addon-imperative-scrolling",
    "Imperative Scrolling",
    import.meta.glob(
      "../../../../packages/addons/imperative-scrolling/docs/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/imperative-scrolling/docs/",
  ),
  packageSection(
    "package-addon-data-export",
    "Data Export",
    import.meta.glob(
      "../../../../packages/addons/data-export/docs/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/data-export/docs/",
  ),
  packageSection(
    "package-addon-diagnostics",
    "Diagnostics",
    import.meta.glob(
      "../../../../packages/addons/diagnostics/docs/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/diagnostics/docs/",
  ),
  packageSection(
    "package-addon-filtering",
    "Filtering",
    import.meta.glob("../../../../packages/addons/filtering/docs/**/page.mdx", {
      eager: true,
    }) as Record<string, MdxPageModule>,
    "../../../../packages/addons/filtering/docs/",
  ),
  packageSection(
    "package-addon-markdown",
    "Markdown",
    import.meta.glob("../../../../packages/addons/markdown/docs/**/page.mdx", {
      eager: true,
    }) as Record<string, MdxPageModule>,
    "../../../../packages/addons/markdown/docs/",
  ),
  packageSection(
    "package-addon-resizable",
    "Resizable",
    import.meta.glob("../../../../packages/addons/resizable/docs/**/page.mdx", {
      eager: true,
    }) as Record<string, MdxPageModule>,
    "../../../../packages/addons/resizable/docs/",
  ),
] as const;
