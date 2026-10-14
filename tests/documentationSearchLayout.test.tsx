import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Sidebar rendering does not need the browser-only SQLite search worker.
vi.mock("../apps/playground/src/search-sqlite/sqliteSearchClient", () => ({
  searchSqlite: vi.fn(async () => []),
  invalidateSqliteSearch: vi.fn(),
}));
import { createMdxSection } from "../apps/playground/src/content/mdxSection";
import { DocumentationSearch } from "../apps/playground/src/components/Sidebar/DocumentationSearch";
import { ExamplesSection } from "../apps/playground/src/components/Sidebar/sections/ExamplesSection";
import { MdxPageSection } from "../apps/playground/src/components/Sidebar/sections/MdxPageSection";

const examples = createMdxSection({
  id: "examples",
  label: "Examples",
  modules: {
    "./page.mdx": {
      default: () => null,
      frontmatter: { label: "Overview" },
    },
  },
});

describe("documentation sidebar search", () => {
  it("shows one global search field across multiple sections", () => {
    const html = renderToStaticMarkup(
      <DocumentationSearch
        sections={[examples, examples]}
        currentPath="/"
        onNavigate={() => {}}
      >
        <ExamplesSection section={examples} onChange={() => {}} />
        <MdxPageSection section={examples} onChange={() => {}} />
      </DocumentationSearch>,
    );

    expect(html.match(/type="search"/g) ?? []).toHaveLength(1);
    expect(html).toContain('aria-label="Search documentation"');
    expect(html).not.toContain("Search examples");
  });
});
