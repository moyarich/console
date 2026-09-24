import {
  createMdxSection,
  type MdxPageModule,
  type MdxSectionPage,
} from "../content/mdxSection";

const pageModules = import.meta.glob("./*/page.mdx", {
  eager: true,
}) as Record<string, MdxPageModule>;

export const CONSOLE_API_SECTION = createMdxSection({
  id: "api",
  label: "API",
  modules: pageModules,
});

export const CONSOLE_API_PAGES = CONSOLE_API_SECTION.pages;

export type ConsoleApiPage = MdxSectionPage;
