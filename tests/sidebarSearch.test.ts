import { describe, expect, it } from "vitest";
import { createMdxSection } from "../apps/playground/src/content/mdxSection";
import {
  filterSidebarByKeys,
  filterSidebarItems,
} from "../apps/playground/src/utils/sidebarSearch";

const section = createMdxSection({
  id: "examples",
  label: "Examples",
  modules: {
    "./01-transport/01-hidden-search/page.mdx": {
      searchText:
        "Connection lifecycle\nReconnect dropped sessions\nconsole.info(connection.readyState)",
      default: () => null,
      frontmatter: { label: "WebSocket", description: "Stream remote output" },
    },
    "./01-transport/02-http/page.mdx": {
      default: () => null,
      frontmatter: { label: "HTTP", description: "Fetch a response" },
    },
    "./02-catalog/page.mdx": {
      default: () => null,
      frontmatter: { label: "Catalog" },
    },
  },
});
function labels(query: string) {
  return filterSidebarItems(section.items, query).flatMap((item) =>
    item.type === "page"
      ? [item.page.label]
      : item.group.items.flatMap((child) =>
          child.type === "page" ? [child.page.label] : [],
        ),
  );
}
describe("sidebar search", () => {
  it("searches body text, headings, and embedded code", () => {
    for (const query of [
      "lifecycle",
      "dropped sessions",
      "console.info",
      "readyState",
    ]) {
      expect(labels(query)).toEqual(["WebSocket"]);
    }
    expect(labels("readyState response")).toEqual([]);
  });
  it("does not match hidden IDs or expand every page in a matching group", () => {
    expect(labels("transport")).toEqual([]);
    expect(labels("hidden search")).toEqual([]);
  });
  it("supports case-insensitive prefixes and all query terms in any order", () => {
    expect(labels("REMOTE web")).toEqual(["WebSocket"]);
    expect(labels("web response")).toEqual([]);
  });
  it("allows small title typos including transpositions", () => {
    for (const query of ["websoket", "websockte", "websockat", "websockeet"]) {
      expect(labels(query)).toEqual(["WebSocket"]);
    }
  });
  it("rejects scattered letters, short fuzzy matches, and description typos", () => {
    for (const query of ["wbst", "log", "htt", "remtoe", "!!!"]) {
      expect(labels(query)).toEqual(query === "htt" ? ["HTTP"] : []);
    }
  });
  it("preserves ancestors for matching pages and restores all items when cleared", () => {
    const result = filterSidebarItems(section.items, "web");
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("group");
    expect(labels(" ")).toEqual(["WebSocket", "HTTP", "Catalog"]);
  });
});

it("preserves relevance order across nested sidebar groups", () => {
  const rankedSection = createMdxSection({
    id: "ranked",
    label: "Ranked",
    modules: {
      "./01-other/01-code/page.mdx": {
        searchKey: "code",
        default: () => null,
        frontmatter: { label: "Code" },
      },
      "./02-terminal/01-description/page.mdx": {
        searchKey: "description",
        default: () => null,
        frontmatter: { label: "Terminal" },
      },
      "./02-terminal/02-ansi/page.mdx": {
        searchKey: "title",
        default: () => null,
        frontmatter: { label: "ANSI" },
      },
    },
  });
  const result = filterSidebarByKeys(
    rankedSection.items,
    new Set(["title", "description", "code"]),
  );
  const flatten = (items: readonly (typeof result)[number][]): string[] =>
    items.flatMap((item) =>
      item.type === "page" ? [item.page.searchKey!] : flatten(item.group.items),
    );
  expect(flatten(result)).toEqual(["title", "description", "code"]);
  expect(flatten(rankedSection.items)).toEqual([
    "code",
    "description",
    "title",
  ]);
});
