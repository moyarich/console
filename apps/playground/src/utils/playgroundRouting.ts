import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { MdxSection, MdxSectionItem, MdxSectionPage } from "./mdxSection";

/** A heading in a page outline, including any nested headings. */
type TocEntry = Toc[number];

/** A resolved documentation page and optional heading to scroll into view. */
export interface PlaygroundRoute {
  /** Documentation section that owns the page. */
  section: MdxSection;
  /** Page matched by its section-relative ID. */
  page: MdxSectionPage;
  /** Heading matched by an optional final path segment. */
  outline?: TocEntry;
}

/**
 * Searches a page outline depth-first, including nested headings.
 *
 * @param items - Outline entries to search.
 * @param id - Exact heading ID to match.
 * @returns The first matching entry, or undefined when no heading matches.
 */
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

/** Finds the first page beneath an exact navigation group ID. */
function findGroupPage(
  items: readonly MdxSectionItem[],
  groupId: string,
): MdxSectionPage | undefined {
  for (const item of items) {
    if (item.type !== "group") continue;
    if (item.group.id === groupId) {
      return firstPage(item.group.items);
    }
    const page = findGroupPage(item.group.items, groupId);
    if (page) return page;
  }
  return undefined;
}

/** Returns the first page in navigation order, including nested groups. */
function firstPage(
  items: readonly MdxSectionItem[],
): MdxSectionPage | undefined {
  for (const item of items) {
    const page = item.type === "page" ? item.page : firstPage(item.group.items);
    if (page) return page;
  }
  return undefined;
}

/** Preserves shared URLs for examples moved out of the custom addon group. */
function resolveExampleSegments(segments: string[]): string[] {
  const oldGroups = [
    ["addons", "custom", "output-surfaces"],
    ["addons", "custom", "extension-points"],
  ];
  for (const [index, prefix] of oldGroups.entries()) {
    if (prefix.every((segment, i) => segments[i] === segment)) {
      segments = [
        "extension-points",
        ...(index === 0 ? ["output-renderer"] : ["overview"]),
        ...segments.slice(prefix.length),
      ];
      break;
    }
  }
  if (
    segments[0] === "extension-points" &&
    segments[1] === "overview" &&
    segments.length === 3
  ) {
    const extensionPoints = [
      "processControlParser",
      "processOutputProcessor",
      "structuredOutputParser",
      "linkProvider",
      "outputRenderer",
      "frameDecorator",
      "emptyStateRenderer",
      "panelElement",
      "messageFilter",
      "messageRenderer",
      "messageDecoration",
      "messageTextProvider",
      "valueRenderer",
      "keyboardShortcut",
      "panelAction",
      "contextMenuAction",
      "messageAction",
    ];
    const point = extensionPoints.find(
      (name) => `consoleextensionpoints${name.toLowerCase()}` === segments[2],
    );
    if (point) {
      const slug = point.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      return ["extension-points", slug];
    }
  }
  if (segments[0] === "extension-points") {
    return segments.filter(
      (segment, index) =>
        !(segment === "overview" && (index === 1 || index === 2)),
    );
  }
  return segments;
}

/**
 * Builds a path of the form /section/page[/nested-page][/heading].
 * Each segment is URI-encoded independently, preserving page hierarchy.
 *
 * @param sectionId - Documentation section ID.
 * @param pageId - Section-relative page ID, with slash-separated hierarchy.
 * @param outlineId - Optional heading ID, encoded as a single final segment.
 * @returns An absolute playground pathname.
 */
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

/**
 * Resolves a pathname against the available sections, pages, and headings.
 * Empty path segments are ignored. Deeper page IDs are tried first so nested
 * pages take precedence over headings on a parent page. A heading must match
 * exactly one remaining segment and exist in the matched page's outline.
 * Group paths resolve to their first page; moved example URLs remain supported.
 *
 * @param pathname - URI-encoded pathname without a query string or fragment.
 * @param sections - Documentation sections available to the playground.
 * @returns The matched route, or undefined for an unknown or incomplete path.
 * @throws {URIError} When a path segment contains malformed URI encoding.
 */
export function resolvePlaygroundPath(
  pathname: string,
  sections: readonly MdxSection[],
): PlaygroundRoute | undefined {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  const [sectionId, ...remainingSegments] = segments;
  const pageSegments =
    sectionId === "examples"
      ? resolveExampleSegments(remainingSegments)
      : remainingSegments;
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

  const groupPage = findGroupPage(section.items, pageSegments.join("/"));
  return groupPage ? { section, page: groupPage } : undefined;
}
