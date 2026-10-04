import { createMdxSection, type MdxPageModule } from "../utils/mdxSection";

const pageModules = Object.fromEntries(
  Object.entries(
    import.meta.glob("../../../../docs/03-reference/**/page.mdx", {
      eager: true,
    }) as Record<string, MdxPageModule>,
  ).map(([path, pageModule]) => [
    `./${path.slice("../../../../docs/03-reference/".length)}`,
    pageModule,
  ]),
);

export const CONSOLE_API_SECTION = createMdxSection({
  id: "api",
  label: "API",
  modules: pageModules,
});
