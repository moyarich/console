import type { MdxSectionItem } from "../content/mdxSection";

export function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Allow one typo in a complete word, including an adjacent transposition. */
export function nearWord(query: string, word: string): boolean {
  if (query.length < 4 || Math.abs(query.length - word.length) > 1)
    return false;
  let index = 0;
  while (index < query.length && query[index] === word[index]) index++;
  if (index === query.length && index === word.length) return true;
  if (query.length === word.length) {
    return (
      query.slice(index + 1) === word.slice(index + 1) ||
      (query[index] === word[index + 1] &&
        query[index + 1] === word[index] &&
        query.slice(index + 2) === word.slice(index + 2))
    );
  }
  const [shorter, longer] =
    query.length < word.length ? [query, word] : [word, query];
  return shorter.slice(index) === longer.slice(index + 1);
}

/** Match page content; ancestor labels and routing IDs are not page results. */
export function filterSidebarItems(
  items: readonly MdxSectionItem[],
  query: string,
): MdxSectionItem[] {
  const terms = words(query);
  if (!terms.length) return query.trim() ? [] : [...items];
  return items.flatMap((item): MdxSectionItem[] => {
    if (item.type === "page") {
      const titleWords = words(
        [item.page.label, item.page.meta.title ?? ""].join(" "),
      );
      const contentWords = [
        ...titleWords,
        ...words(item.page.description ?? ""),
        ...words(item.page.searchText ?? ""),
      ];
      const matches = terms.every(
        (term) =>
          contentWords.some((word) => word.startsWith(term)) ||
          titleWords.some((word) => nearWord(term, word)),
      );
      return matches ? [item] : [];
    }
    const children = filterSidebarItems(item.group.items, query);
    return children.length
      ? [{ ...item, group: { ...item.group, items: children } }]
      : [];
  });
}

export function filterSidebarByKeys(
  items: readonly MdxSectionItem[],
  keys: ReadonlySet<string>,
): MdxSectionItem[] {
  const ranks = new Map([...keys].map((key, index) => [key, index]));
  function rank(item: MdxSectionItem): number {
    return item.type === "page"
      ? (ranks.get(item.page.searchKey ?? "") ?? Infinity)
      : Math.min(...item.group.items.map(rank));
  }
  return items
    .flatMap((item): MdxSectionItem[] => {
      if (item.type === "page")
        return item.page.searchKey && keys.has(item.page.searchKey)
          ? [item]
          : [];
      const children = filterSidebarByKeys(item.group.items, keys);
      return children.length
        ? [{ ...item, group: { ...item.group, items: children } }]
        : [];
    })
    .sort((a, b) => rank(a) - rank(b));
}
