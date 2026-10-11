import { createPackageNavigation } from "./packageNavigation";
import type { MdxPageModule } from "../utils/mdxSection";
import { createPackageSections } from "./createPackageSections";

export const PACKAGE_SECTIONS = createPackageSections(
  import.meta.glob<MdxPageModule>(
    ["./*/examples/**/page.mdx", "./addons/*/examples/**/page.mdx"],
    { base: "../../../../packages", eager: true },
  ),
  import.meta.glob<{ name: string }>(
    ["./*/package.json", "./addons/*/package.json"],
    { base: "../../../../packages", eager: true, import: "default" },
  ),
);

export const PACKAGE_NAVIGATION = createPackageNavigation(PACKAGE_SECTIONS);
