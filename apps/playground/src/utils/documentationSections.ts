import { CONSOLE_API_SECTION } from "../api";
import { CONSOLE_DEVELOPMENT_SECTION, CONSOLE_OVERVIEW_SECTION } from "../docs";
import type { MdxSection } from "./mdxSection";

export const DOCUMENTATION_SECTIONS: readonly MdxSection[] = [
  CONSOLE_OVERVIEW_SECTION,
  CONSOLE_API_SECTION,
  CONSOLE_DEVELOPMENT_SECTION,
];
