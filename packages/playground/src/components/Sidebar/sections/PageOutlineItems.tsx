import type { Toc } from "@stefanprobst/rehype-extract-toc";

type TocEntry = Toc[number];

interface PageOutlineItemsProps {
  items: Toc;
  value?: string;
  labelPrefix?: string;
  onChange: (id: string) => void;
}

function getLabel(item: TocEntry, labelPrefix?: string) {
  if (labelPrefix && item.value.startsWith(labelPrefix)) {
    return item.value.slice(labelPrefix.length);
  }

  return item.value;
}

export function PageOutlineItems({
  items,
  value,
  labelPrefix,
  onChange,
}: PageOutlineItemsProps) {
  return (
    <div className="sidebar-tree sidebar-outline">
      {items.map((item, index) => {
        const key = item.id ?? `${item.depth}:${item.value}:${index}`;

        return (
          <div className="sidebar-outline-entry" key={key}>
            {item.id && (
              <button
                type="button"
                className="sidebar-item sidebar-outline-item"
                aria-current={item.id === value ? "location" : undefined}
                onClick={() => onChange(item.id!)}
              >
                <span>{getLabel(item, labelPrefix)}</span>
              </button>
            )}

            {item.children?.length ? (
              <div className="sidebar-tree-children">
                <PageOutlineItems
                  items={item.children}
                  value={value}
                  labelPrefix={labelPrefix}
                  onChange={onChange}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
