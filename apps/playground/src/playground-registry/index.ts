import { REPOSITORY_DOCS_SECTIONS } from "./repository-docs-sections";
import {
  ADDONS_SECTION,
  CONSOLE_CORE_PACKAGE_SECTION,
  CONSOLE_PACKAGE_SECTION,
} from "./packages";
import type { MdxSection } from "@src/utils/mdxSection";

import { CONSOLE_EXAMPLE_SECTION, DEFAULT_CONSOLE_EXAMPLE } from "./examples";
import { buildPlaygroundPath } from "@src/utils/playgroundRouting";

export const DOCUMENTATION_SECTIONS: readonly MdxSection[] = [
  REPOSITORY_DOCS_SECTIONS,
  CONSOLE_PACKAGE_SECTION,
  CONSOLE_CORE_PACKAGE_SECTION,
  ADDONS_SECTION,
];

export const PLAYGROUND_SECTIONS = [
  CONSOLE_EXAMPLE_SECTION,
  ...DOCUMENTATION_SECTIONS,
] as const;

export const DEFAULT_PLAYGROUND_PATH = buildPlaygroundPath(
  CONSOLE_EXAMPLE_SECTION.id,
  DEFAULT_CONSOLE_EXAMPLE.id,
);
