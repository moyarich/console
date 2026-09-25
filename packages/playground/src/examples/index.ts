import {
  createMdxSection,
  type MdxPageModule,
  type MdxSectionPage,
} from "../utils/mdxSection";

const pageModules = import.meta.glob("../../../../docs/examples/**/page.mdx", {
  eager: true,
}) as Record<string, MdxPageModule>;

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
