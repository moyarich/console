import { useEffect, useState } from "react";
import type { MdxSectionItem } from "../content/mdxSection";
import { filterSidebarByKeys } from "../utils/sidebarSearch";
import {
  invalidateSqliteSearch,
  searchSqlite,
} from "../search-sqlite/sqliteSearchClient";

export function useSidebarSearch(
  items: readonly MdxSectionItem[],
  query: string,
) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!import.meta.hot) return;
    const onUpdate = () => {
      invalidateSqliteSearch();
      setRevision((value) => value + 1);
    };
    import.meta.hot.on("sqlite-search:updated", onUpdate);
    return () => import.meta.hot?.off("sqlite-search:updated", onUpdate);
  }, []);
  const [result, setResult] = useState<{
    query: string;
    keys: string[];
    revision: number;
    error?: string;
  }>({ query: "", keys: [], revision: -1 });
  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchSqlite(query).then(
        (keys) => {
          if (!cancelled) setResult({ query, keys, revision });
        },
        (error: Error) => {
          if (!cancelled)
            setResult({ query, keys: [], revision, error: error.message });
        },
      );
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, revision]);
  const loading =
    Boolean(query) && (result.query !== query || result.revision !== revision);
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
