import { createPackageNavigation } from "./packageNavigation";
import type { MdxPageModule } from "../utils/mdxSection";
import { createPackageSections } from "./createPackageSections";

/** Vite glob patterns must remain statically analyzable; add workspace depths here. */
export const PACKAGE_PAGE_GLOBS = [
  "./*/examples/**/page.mdx",
  "./addons/*/examples/**/page.mdx",
] as const;

export const PACKAGE_METADATA_GLOBS = [
  "./*/package.json",
  "./addons/*/package.json",
] as const;

export const PACKAGE_SECTIONS = createPackageSections(
  import.meta.glob<MdxPageModule>(
    PACKAGE_PAGE_GLOBS,
    { base: "../../../../packages", eager: true },
  ),
  import.meta.glob<{ name: string }>(
    PACKAGE_METADATA_GLOBS,
    {
      base: "../../../../packages",
      eager: true,
      import: "default",
    },
  ),
);

export const PACKAGE_NAVIGATION = createPackageNavigation(PACKAGE_SECTIONS);
