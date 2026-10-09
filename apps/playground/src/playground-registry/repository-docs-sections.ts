import { createMdxSection, type MdxPageModule } from "@src/utils/mdxSection";

const modules = import.meta.glob<MdxPageModule>("./**/page.mdx", {
  base: "../../../../docs",
  eager: true,
});

export const REPOSITORY_DOCS_SECTIONS = createMdxSection({
  id: "docs",
  label: "Docs",
  modules,
});
