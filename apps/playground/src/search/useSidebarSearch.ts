import { useEffect, useState } from "react";
import type { MdxSectionItem } from "../content/mdxSection";
import { filterSidebarByKeys } from "../utils/sidebarSearch";
import { searchSqlite } from "../search-sqlite/sqliteSearchClient";

export function useSidebarSearch(
  items: readonly MdxSectionItem[],
  query: string,
) {
  const [result, setResult] = useState<{
    query: string;
    keys: string[];
    error?: string;
  }>({ query: "", keys: [] });
  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchSqlite(query).then(
        (keys) => {
          if (!cancelled) setResult({ query, keys });
        },
        (error: Error) => {
          if (!cancelled) setResult({ query, keys: [], error: error.message });
        },
      );
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);
  const loading = Boolean(query) && result.query !== query;
  return {
    items: !query
      ? [...items]
      : loading
        ? []
        : filterSidebarByKeys(items, new Set(result.keys)),
    loading,
    error: query && result.query === query ? result.error : undefined,
  };
}
