import { createPackageNavigation } from "./packageNavigation";
import { createPackageSections } from "./createPackageSections";
import { PACKAGE_MODULES, PACKAGE_METADATA } from "./registrySources.generated";

export const PACKAGE_SECTIONS = createPackageSections(
  PACKAGE_MODULES,
  PACKAGE_METADATA,
);
export const PACKAGE_NAVIGATION = createPackageNavigation(PACKAGE_SECTIONS);
