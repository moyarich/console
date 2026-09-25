import { createMdxSection, type MdxPageModule } from "../utils/mdxSection";

const pageModules = Object.fromEntries(
  Object.entries(
    import.meta.glob("../../../../api/**/page.mdx", {
      eager: true,
    }) as Record<string, MdxPageModule>,
  ).map(([path, pageModule]) => [
    `./${path.slice("../../../../api/".length)}`,
    pageModule,
  ]),
);

export const CONSOLE_API_SECTION = createMdxSection({
  id: "api",
  label: "API",
  modules: pageModules,
});
