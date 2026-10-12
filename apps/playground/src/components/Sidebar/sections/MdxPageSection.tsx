import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { MdxSection, MdxSectionItem } from "../../../utils/mdxSection";
import { PageOutlineItems } from "./PageOutlineItems";

interface MdxPageSectionProps {
  section: MdxSection;
  value?: string;
  outlineValue?: string;
  onChange: (id: string, outlineId?: string) => void;
}

interface MdxSectionItemsProps {
  items: readonly MdxSectionItem[];
  value?: string;
  outlineValue?: string;
  collapsedGroupIds: ReadonlySet<string>;
  searching: boolean;
  onChange: (id: string, outlineId?: string) => void;
  onToggleGroup: (id: string) => void;
}

function MdxSectionItems({
  items,
  value,
  outlineValue,
  collapsedGroupIds,
  searching,
  onChange,
  onToggleGroup,
}: MdxSectionItemsProps) {
  return (
    <div className="sidebar-tree">
      {items.map((item) => {
        if (item.type === "page") {
          const active = item.page.id === value;
          const showOutline =
            item.page.meta.sidebarOutline === true &&
            item.page.outline.length > 0;
          const outlineLabelPrefix =
            typeof item.page.meta.outlineLabelPrefix === "string"
              ? item.page.meta.outlineLabelPrefix
              : undefined;

          return (
            <div className="sidebar-tree-page" key={item.id}>
              <button
                type="button"
                className="sidebar-item"
                aria-current={active && !outlineValue ? "page" : undefined}
                title={item.page.description}
                onClick={() => onChange(item.page.id)}
              >
                <span>{item.page.label}</span>
              </button>

              {showOutline && (
                <div className="sidebar-tree-children">
                  <PageOutlineItems
                    items={item.page.outline}
                    value={active ? outlineValue : undefined}
                    labelPrefix={outlineLabelPrefix}
                    onChange={(outlineId) => onChange(item.page.id, outlineId)}
                  />
                </div>
              )}
            </div>
          );
        }

        const collapsed = !searching && collapsedGroupIds.has(item.group.id);

        return (
          <div className="sidebar-tree-group" key={item.id}>
            <button
              type="button"
              className="sidebar-group-trigger"
              aria-expanded={!collapsed}
              onClick={() => onToggleGroup(item.group.id)}
            >
              <span className="sidebar-group-label">{item.group.label}</span>
              <ChevronDown
                className={collapsed ? undefined : "expanded"}
                aria-hidden="true"
              />
            </button>

            {!collapsed && (
              <div className="sidebar-tree-children">
                <MdxSectionItems
                  items={item.group.items}
                  value={value}
                  outlineValue={outlineValue}
                  collapsedGroupIds={collapsedGroupIds}
                  searching={searching}
                  onChange={onChange}
                  onToggleGroup={onToggleGroup}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Preserve ancestor groups when filtering the documentation tree. */
function filterItems(
  items: readonly MdxSectionItem[],
  query: string,
  ancestors: readonly string[] = [],
): MdxSectionItem[] {
  if (!query) return [...items];
  return items.flatMap((item): MdxSectionItem[] => {
    if (item.type === "page") {
      const searchable = [
        item.page.label,
        item.page.description ?? "",
        item.page.id,
        ...ancestors,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query) ? [item] : [];
    }
    const children = filterItems(item.group.items, query, [
      ...ancestors,
      item.group.label,
    ]);
    return children.length
      ? [{ ...item, group: { ...item.group, items: children } }]
      : [];
  });
}

export function MdxPageSection({
  section,
  value,
  outlineValue,
  onChange,
}: MdxPageSectionProps) {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () => filterItems(section.items, normalizedQuery),
    [section.items, normalizedQuery],
  );
  const headingId = `sidebar-${section.id}-title`;

  function toggleGroup(groupId: string) {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  }

  return (
    <section className="sidebar-section" aria-labelledby={headingId}>
      <div className="sidebar-section-header">
        <div className="sidebar-section-heading">
          <strong id={headingId}>{section.label}</strong>
          <span className="sidebar-count">{section.pages.length}</span>
        </div>
      </div>

      <label className="sidebar-search" style={{ margin: "0 6px" }}>
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${section.label}…`}
          aria-label={`Search ${section.label}`}
        />
      </label>
      <div className="sidebar-section-items">
        <MdxSectionItems
          items={filteredItems}
          value={value}
          outlineValue={outlineValue}
          collapsedGroupIds={collapsedGroupIds}
          searching={Boolean(normalizedQuery)}
          onChange={onChange}
          onToggleGroup={toggleGroup}
        />
        {filteredItems.length === 0 && (
          <p className="sidebar-empty" role="status">
            No matching pages
          </p>
        )}
      </div>
    </section>
  );
}
