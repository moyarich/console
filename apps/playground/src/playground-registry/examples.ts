import { createMdxSection, type MdxPageModule } from "@src/utils/mdxSection";

function prefixExampleModules(
  modules: Record<string, MdxPageModule>,
  virtualPrefix: string,
) {
  return Object.entries(modules).map(([path, pageModule]) => [
    `./${virtualPrefix}${path.replace(/^\.\//, "")}`,
    pageModule,
  ]);
}

const pageModules = Object.fromEntries([
  ...Object.entries(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/console/docs/examples",
      eager: true,
    }),
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/imperative-scrolling/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/01-imperative-scroll-controls/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/annotations/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/06-annotations/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/data-export/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/02-data-export/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/diagnostics/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/03-diagnostics/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/filtering/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/04-filtering/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/markdown/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/05-markdown/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/navigation/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/07-navigation/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/selection/docs/examples",
      eager: true,
    }),
    "60-addons/01-core/08-selection/",
  ),
  ...prefixExampleModules(
    import.meta.glob<MdxPageModule>("./**/page.mdx", {
      base: "../../../../packages/addons/resizable/docs/examples",
      eager: true,
    }),
    "80-additional-usage/18-resizable-console/",
  ),
]);

export const CONSOLE_EXAMPLE_SECTION = createMdxSection({
  id: "examples",
  label: "Examples",
  modules: pageModules,
});

export const DEFAULT_CONSOLE_EXAMPLE =
  CONSOLE_EXAMPLE_SECTION.getPage("console-methods/basic-output/console-log") ??
  CONSOLE_EXAMPLE_SECTION.pages[0]!;
