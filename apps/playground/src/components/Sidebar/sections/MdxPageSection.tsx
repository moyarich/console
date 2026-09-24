import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { MdxSection, MdxSectionItem } from "../../../utils/mdxSection";

interface MdxPageSectionProps {
  section: MdxSection;
  value?: string;
  onChange: (id: string) => void;
}

interface MdxSectionItemsProps {
  items: readonly MdxSectionItem[];
  value?: string;
  collapsedGroupIds: ReadonlySet<string>;
  onChange: (id: string) => void;
  onToggleGroup: (id: string) => void;
}

function MdxSectionItems({
  items,
  value,
  collapsedGroupIds,
  onChange,
  onToggleGroup,
}: MdxSectionItemsProps) {
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

        const collapsed = collapsedGroupIds.has(item.group.id);

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
                  collapsedGroupIds={collapsedGroupIds}
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

export function MdxPageSection({
  section,
  value,
  onChange,
}: MdxPageSectionProps) {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(),
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

      <div className="sidebar-section-items">
        <MdxSectionItems
          items={section.items}
          value={value}
          collapsedGroupIds={collapsedGroupIds}
          onChange={onChange}
          onToggleGroup={toggleGroup}
        />
      </div>
    </section>
  );
}
