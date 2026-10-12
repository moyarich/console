import { createPackageNavigation } from "./packageNavigation";
import type { MdxPageModule } from "../content/mdxSection";
import { createPackageSections } from "./createPackageSections";

/** Statically declared workspace globs required for Vite's build-time discovery. */
export const PACKAGE_SECTIONS = createPackageSections(
  import.meta.glob<MdxPageModule>(
    ["./*/**/page.mdx", "./addons/*/**/page.mdx"],
    { base: "../../../../packages", eager: true },
  ),
  import.meta.glob<{ name: string }>(
    ["./*/package.json", "./addons/*/package.json"],
    {
      base: "../../../../packages",
      eager: true,
      import: "default",
    },
  ),
);

export const PACKAGE_NAVIGATION = createPackageNavigation(PACKAGE_SECTIONS);
