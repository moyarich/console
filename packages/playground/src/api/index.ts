import { createMdxSection, type MdxPageModule } from "../utils/mdxSection";

const pageModules = import.meta.glob("../../../../api/**/page.mdx", {
  eager: true,
}) as Record<string, MdxPageModule>;

export const CONSOLE_API_SECTION = createMdxSection({
  id: "api",
  label: "API",
  modules: pageModules,
});
