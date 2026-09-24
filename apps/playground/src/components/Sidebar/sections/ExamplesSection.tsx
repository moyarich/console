import {
  Braces,
  ChevronDown,
  CircleDot,
  Layers3,
  Puzzle,
  Radio,
  Search,
  SquareTerminal,
  Terminal,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  MdxSection,
  MdxSectionItem,
} from "../../../utils/mdxSection";

interface ExamplesSectionProps {
  section: MdxSection;
  value?: string;
  onChange: (id: string) => void;
}

interface ExampleTreeProps {
  items: readonly MdxSectionItem[];
  value?: string;
  searching: boolean;
  collapsedGroupIds: ReadonlySet<string>;
  onChange: (id: string) => void;
  onToggleGroup: (id: string) => void;
  depth?: number;
}

function getGroupIcon(groupId: string): LucideIcon {
  if (groupId.includes("ansi")) {
    return Terminal;
  }

  if (groupId.includes("console-method")) {
    return SquareTerminal;
  }

  if (groupId.includes("transport")) {
    return Waypoints;
  }

  if (groupId.includes("event")) {
    return Radio;
  }

  if (groupId.includes("addon")) {
    return Puzzle;
  }

  if (groupId.includes("capture")) {
    return CircleDot;
  }

  if (groupId.includes("usage")) {
    return Layers3;
  }

  return Braces;
}

function countPages(items: readonly MdxSectionItem[]): number {
  return items.reduce(
    (count, item) =>
      count +
      (item.type === "page" ? 1 : countPages(item.group.items)),
    0,
  );
}

function filterItems(
  items: readonly MdxSectionItem[],
  normalizedQuery: string,
  ancestorLabels: readonly string[] = [],
): MdxSectionItem[] {
  if (!normalizedQuery) {
    return [...items];
  }

  return items.flatMap((item) => {
    if (item.type === "page") {
      const matches = [
        item.page.label,
        item.page.description ?? "",
        item.page.id,
        ...ancestorLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

      return matches ? [item] : [];
    }

    const nextAncestorLabels = [...ancestorLabels, item.group.label];
    const childItems = filterItems(
      item.group.items,
      normalizedQuery,
      nextAncestorLabels,
    );

    if (!childItems.length) {
      return [];
    }

    return [
      {
        ...item,
        group: {
          ...item.group,
          items: childItems,
        },
      },
    ];
  });
}

function ExampleTree({
  items,
  value,
  searching,
  collapsedGroupIds,
  onChange,
  onToggleGroup,
  depth = 0,
}: ExampleTreeProps) {
  return (
    <div className="sidebar-tree">
      {items.map((item) => {
        if (item.type === "page") {
          const active = item.page.id === value;

          return (
            <button
              key={item.id}
              type="button"
              className="sidebar-item"
              aria-current={active ? "page" : undefined}
              title={item.page.description}
              onClick={() => onChange(item.page.id)}
            >
              <span>{item.page.label}</span>
            </button>
          );
        }

        const expanded =
          searching || !collapsedGroupIds.has(item.group.id);
        const Icon = depth === 0 ? getGroupIcon(item.group.id) : undefined;

        return (
          <div className="sidebar-tree-group" key={item.id}>
            <button
              type="button"
              className="sidebar-group-trigger"
              aria-expanded={expanded}
              onClick={() => onToggleGroup(item.group.id)}
            >
              <span className="sidebar-group-label">
                {Icon && <Icon aria-hidden="true" />}
                <span>{item.group.label}</span>
              </span>

              <span className="sidebar-group-meta">
                <span>{countPages(item.group.items)}</span>
                <ChevronDown
                  className={expanded ? "expanded" : undefined}
                  aria-hidden="true"
                />
              </span>
            </button>

            {expanded && (
              <div className="sidebar-tree-children">
                <ExampleTree
                  items={item.group.items}
                  value={value}
                  searching={searching}
                  collapsedGroupIds={collapsedGroupIds}
                  onChange={onChange}
                  onToggleGroup={onToggleGroup}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExamplesSection({
  section,
  value,
  onChange,
}: ExamplesSectionProps) {
  const [query, setQuery] = useState("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const navigationItems = useMemo(
    () => filterItems(section.items, normalizedQuery),
    [normalizedQuery, section.items],
  );
  const searching = normalizedQuery.length > 0;

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
    <section
      className="sidebar-section"
      aria-labelledby="sidebar-examples-title"
    >
      <div className="sidebar-section-header">
        <div className="sidebar-section-heading">
          <strong id="sidebar-examples-title">{section.label}</strong>
          <span className="sidebar-count">{section.pages.length}</span>
        </div>

        <label className="sidebar-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search examples…"
            aria-label="Search examples"
          />
        </label>
      </div>

      <div className="sidebar-groups">
        <ExampleTree
          items={navigationItems}
          value={value}
          searching={searching}
          collapsedGroupIds={collapsedGroupIds}
          onChange={onChange}
          onToggleGroup={toggleGroup}
        />

        {!navigationItems.length && (
          <div className="sidebar-empty">
            <Search aria-hidden="true" />
            <strong>No examples found</strong>
            <span>Try log, table, ANSI, transport, or addon.</span>
          </div>
        )}
      </div>
    </section>
  );
}
