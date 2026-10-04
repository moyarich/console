import {
  createMdxSection,
  type MdxPageModule,
  type MdxSectionPage,
} from "../utils/mdxSection";

function mapModules(
  modules: Record<string, MdxPageModule>,
  sourcePrefix: string,
  virtualPrefix = "",
) {
  return Object.entries(modules).map(([path, pageModule]) => [
    `./${virtualPrefix}${path.slice(sourcePrefix.length)}`,
    pageModule,
  ]);
}

const pageModules = Object.fromEntries([
  ...mapModules(
    import.meta.glob("../../../../packages/console/docs/examples/**/page.mdx", {
      eager: true,
    }) as Record<string, MdxPageModule>,
    "../../../../packages/console/docs/examples/",
  ),
  ...mapModules(
    import.meta.glob(
      "../../../../packages/addons/imperative-scrolling/docs/examples/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/imperative-scrolling/docs/examples/",
    "60-addons/01-core/01-imperative-scroll-controls/",
  ),
  ...mapModules(
    import.meta.glob(
      "../../../../packages/addons/data-export/docs/examples/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/data-export/docs/examples/",
    "60-addons/01-core/02-data-export/",
  ),
  ...mapModules(
    import.meta.glob(
      "../../../../packages/addons/diagnostics/docs/examples/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/diagnostics/docs/examples/",
    "60-addons/01-core/03-diagnostics/",
  ),
  ...mapModules(
    import.meta.glob(
      "../../../../packages/addons/filtering/docs/examples/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/filtering/docs/examples/",
    "60-addons/01-core/04-filtering/",
  ),
  ...mapModules(
    import.meta.glob(
      "../../../../packages/addons/markdown/docs/examples/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/markdown/docs/examples/",
    "60-addons/01-core/05-markdown/",
  ),
  ...mapModules(
    import.meta.glob(
      "../../../../packages/addons/resizable/docs/examples/**/page.mdx",
      { eager: true },
    ) as Record<string, MdxPageModule>,
    "../../../../packages/addons/resizable/docs/examples/",
    "80-additional-usage/18-resizable-console/",
  ),
]);

export const CONSOLE_EXAMPLE_SECTION = createMdxSection({
  id: "examples",
  label: "Examples",
  modules: pageModules,
});

export const CONSOLE_EXAMPLES = CONSOLE_EXAMPLE_SECTION.pages;

export type ConsoleExample = MdxSectionPage;

export const DEFAULT_CONSOLE_EXAMPLE =
  CONSOLE_EXAMPLE_SECTION.getPage("console-methods/basic-output/console-log") ??
  CONSOLE_EXAMPLES[0]!;
