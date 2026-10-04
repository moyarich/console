import { createMdxSection, type MdxPageModule } from "../utils/mdxSection";

const overviewModules = import.meta.glob("../../../../docs/page.mdx", {
  eager: true,
}) as Record<string, MdxPageModule>;

export const CONSOLE_OVERVIEW_SECTION = createMdxSection({
  id: "docs",
  label: "Docs",
  modules: Object.fromEntries(
    Object.entries(overviewModules).map(([path, pageModule]) => [
      `./${path.slice("../../../../docs/".length)}`,
      pageModule,
    ]),
  ),
});

const developmentModules = import.meta.glob(
  "../../../../docs/04-development/**/page.mdx",
  {
    eager: true,
  },
) as Record<string, MdxPageModule>;

export const CONSOLE_DEVELOPMENT_SECTION = createMdxSection({
  id: "development",
  label: "Development",
  modules: Object.fromEntries(
    Object.entries(developmentModules).map(([path, pageModule]) => [
      `./${path.slice("../../../../docs/04-development/".length)}`,
      pageModule,
    ]),
  ),
});
