import { CONSOLE_API_SECTION } from "../api";
import type { MdxSection } from "./mdxSection";

export const DOCUMENTATION_SECTIONS: readonly MdxSection[] = [
  CONSOLE_API_SECTION,
];

export function getDocumentationSection(sectionId: string) {
  return DOCUMENTATION_SECTIONS.find((section) => section.id === sectionId);
}
