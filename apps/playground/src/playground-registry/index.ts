import { REPOSITORY_DOCS_SECTIONS } from "./repository-docs-sections";

import { PACKAGE_SECTIONS } from "./package-sections";
import {
  buildPlaygroundPath,
  resolvePlaygroundPath,
} from "@src/utils/playgroundRouting";

export const PLAYGROUND_SECTIONS = [
  ...PACKAGE_SECTIONS,
  REPOSITORY_DOCS_SECTIONS,
].filter((section) => section.pages.length > 0);

export function resolvePlaygroundRoute(pathname: string) {
  return resolvePlaygroundPath(pathname, PLAYGROUND_SECTIONS);
}

const defaultSection = PACKAGE_SECTIONS.find(
  (section) => section.id === "package-console",
)!;
const defaultPage =
  defaultSection.getPage("console-methods/basic-output/console-log") ??
  defaultSection.defaultPage!;
export const DEFAULT_PLAYGROUND_PATH = buildPlaygroundPath(
  defaultSection.id,
  defaultPage.id,
);
