import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MdxSection, MdxSectionPage } from "./mdxSection";

type TocEntry = Toc[number];

export interface PlaygroundRoute {
  section: MdxSection;
  page: MdxSectionPage;
  outline?: TocEntry;
}

function findOutlineItem(items: Toc, id: string): TocEntry | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    if (item.children?.length) {
      const child = findOutlineItem(item.children, id);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

export function buildPlaygroundPath(
  sectionId: string,
  pageId: string,
  outlineId?: string,
) {
  const segments = [
    sectionId,
    ...pageId.split("/"),
    ...(outlineId ? [outlineId] : []),
  ];

  return `/${segments.map(encodeURIComponent).join("/")}`;
}

export function resolvePlaygroundPath(
  pathname: string,
  sections: readonly MdxSection[],
): PlaygroundRoute | undefined {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  const [sectionId, ...pageSegments] = segments;
  const section = sections.find((candidate) => candidate.id === sectionId);

  if (!section || !pageSegments.length) {
    return undefined;
  }

  const pages = [...section.pages].sort(
    (left, right) => right.id.split("/").length - left.id.split("/").length,
  );

  for (const page of pages) {
    const pageIdSegments = page.id.split("/");

    if (
      pageIdSegments.some((segment, index) => pageSegments[index] !== segment)
    ) {
      continue;
    }

    const remainder = pageSegments.slice(pageIdSegments.length);

    if (remainder.length === 0) {
      return { section, page };
    }

    if (remainder.length === 1) {
      const outline = findOutlineItem(page.outline, remainder[0]!);

      if (outline) {
        return { section, page, outline };
      }
    }
  }

  return undefined;
}
