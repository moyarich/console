import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { MdxSection, MdxSectionItem } from "../../content/mdxSection";
import { useSidebarSearch } from "../../search/useSidebarSearch";
import { buildPlaygroundPath } from "../../utils/playgroundRouting";

interface DocumentationSearchProps {
  sections: readonly MdxSection[];
  currentPath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}

export function DocumentationSearch({
  sections,
  currentPath,
  onNavigate,
  children,
}: DocumentationSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const pages = sections.flatMap((section) =>
    section.pages.map((page) => ({
      section,
      page,
      path: buildPlaygroundPath(section.id, page.id),
    })),
  );
  const items: MdxSectionItem[] = pages.map(({ page, path }) => ({
    type: "page",
    id: path,
    order: page.order,
    page,
  }));
  const {
    items: results,
    loading,
    error,
  } = useSidebarSearch(items, normalizedQuery);
  const byPath = new Map(pages.map((entry) => [entry.path, entry]));

  return (
    <>
      <label className="sidebar-search sidebar-documentation-search">
        <Search aria-hidden="true" />
        <input
          type="search"
          aria-label="Search documentation"
          placeholder="Search all documentation…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {!normalizedQuery ? (
        children
      ) : (
        <section className="sidebar-section" aria-label="Search results">
          {loading || error ? (
            <p className="sidebar-empty" role="status">
              {error ?? "Searching…"}
            </p>
          ) : results.length === 0 ? (
            <p className="sidebar-empty" role="status">
              No matching pages
            </p>
          ) : (
            <>
              <p className="sidebar-search-count" role="status">
                {results.length} matching pages
              </p>
              {results.map((item) => {
                const entry = byPath.get(item.id)!;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="sidebar-item sidebar-search-result"
                    aria-current={
                      currentPath === entry.path ? "page" : undefined
                    }
                    title={entry.page.description}
                    onClick={() => onNavigate(entry.path)}
                  >
                    <span>{entry.page.label}</span>
                    <small>{entry.section.label}</small>
                  </button>
                );
              })}
            </>
          )}
        </section>
      )}
    </>
  );
}
