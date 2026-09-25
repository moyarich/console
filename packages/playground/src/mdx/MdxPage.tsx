import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  MdxSection,
  MdxSectionGroup,
  MdxSectionItem,
  MdxSectionPage,
} from "../utils/mdxSection";
import { resolvePageTocOptions } from "../utils/pageMetadata";
import { buildPlaygroundPath } from "../utils/playgroundRouting";

type TocEntry = Toc[number];

interface MdxPageProps {
  section: MdxSection;
  page: MdxSectionPage;
  activeOutlineId?: string;
  children: ReactNode;
}

interface MdxPageTocProps {
  sectionId: string;
  page: MdxSectionPage;
  activeOutlineId?: string;
}

function getFirstPageId(items: readonly MdxSectionItem[]): string | undefined {
  for (const item of items) {
    if (item.type === "page") {
      return item.page.id;
    }

    const pageId = getFirstPageId(item.group.items);

    if (pageId) {
      return pageId;
    }
  }

  return undefined;
}

function findGroupPath(
  items: readonly MdxSectionItem[],
  pageId: string,
): MdxSectionGroup[] | undefined {
  for (const item of items) {
    if (item.type === "page") {
      if (item.page.id === pageId) {
        return [];
      }

      continue;
    }

    const childPath = findGroupPath(item.group.items, pageId);

    if (childPath) {
      return [item.group, ...childPath];
    }
  }

  return undefined;
}

function findTocEntry(items: Toc, id: string): TocEntry | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    if (item.children?.length) {
      const child = findTocEntry(item.children, id);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

function getOutlineLabel(page: MdxSectionPage, outlineId?: string) {
  if (!outlineId) {
    return undefined;
  }

  const outline = findTocEntry(page.outline, outlineId);

  if (!outline) {
    return undefined;
  }

  const prefix = page.meta.outlineLabelPrefix;

  return typeof prefix === "string" && outline.value.startsWith(prefix)
    ? outline.value.slice(prefix.length)
    : outline.value;
}

function TocItems({
  items,
  sectionId,
  pageId,
  activeOutlineId,
}: {
  items: Toc;
  sectionId: string;
  pageId: string;
  activeOutlineId?: string;
}) {
  return (
    <ol className="mdx-page-toc-list">
      {items.map((item, index) => {
        const key = item.id ?? `${item.depth}:${item.value}:${index}`;

        return (
          <li key={key}>
            {item.id ? (
              <Link
                to={buildPlaygroundPath(sectionId, pageId, item.id)}
                aria-current={
                  item.id === activeOutlineId ? "location" : undefined
                }
              >
                {item.value}
              </Link>
            ) : (
              <span>{item.value}</span>
            )}

            {item.children?.length ? (
              <TocItems
                items={item.children}
                sectionId={sectionId}
                pageId={pageId}
                activeOutlineId={activeOutlineId}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function MdxPageToc({ sectionId, page, activeOutlineId }: MdxPageTocProps) {
  const options = resolvePageTocOptions(page.meta);
  const [open, setOpen] = useState(options.defaultOpen);

  if (!options.show || page.outline.length === 0) {
    return null;
  }

  const content = (
    <nav className="mdx-page-toc-nav" aria-label={options.label}>
      <TocItems
        items={page.outline}
        sectionId={sectionId}
        pageId={page.id}
        activeOutlineId={activeOutlineId}
      />
    </nav>
  );

  if (!options.collapsible) {
    return (
      <aside className="mdx-page-toc">
        <strong className="mdx-page-toc-title">{options.label}</strong>
        {content}
      </aside>
    );
  }

  return (
    <details
      className="mdx-page-toc"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="mdx-page-toc-summary">
        <strong>{options.label}</strong>
        <ChevronDown aria-hidden="true" />
      </summary>
      {content}
    </details>
  );
}

export function MdxPage({
  section,
  page,
  activeOutlineId,
  children,
}: MdxPageProps) {
  const groups = findGroupPath(section.items, page.id) ?? [];
  const title = page.meta.title ?? page.label;
  const activeOutlineLabel = getOutlineLabel(page, activeOutlineId);

  return (
    <article className="mdx-page">
      <header className="mdx-page-header">
        <nav className="mdx-page-path" aria-label="Breadcrumb">
          {section.defaultPage ? (
            <Link to={buildPlaygroundPath(section.id, section.defaultPage.id)}>
              {section.label}
            </Link>
          ) : (
            <span>{section.label}</span>
          )}

          {groups.map((group) => {
            const defaultPageId = getFirstPageId(group.items);

            return (
              <span className="mdx-page-path-segment" key={group.id}>
                <span aria-hidden="true">/</span>
                {defaultPageId ? (
                  <Link to={buildPlaygroundPath(section.id, defaultPageId)}>
                    {group.label}
                  </Link>
                ) : (
                  <span>{group.label}</span>
                )}
              </span>
            );
          })}

          <span className="mdx-page-path-segment">
            <span aria-hidden="true">/</span>
            <strong>{page.label}</strong>
          </span>

          {activeOutlineLabel && (
            <span className="mdx-page-path-segment">
              <span aria-hidden="true">/</span>
              <strong>{activeOutlineLabel}</strong>
            </span>
          )}
        </nav>

        <h1>{title}</h1>
        {page.description && <p>{page.description}</p>}

        <MdxPageToc
          sectionId={section.id}
          page={page}
          activeOutlineId={activeOutlineId}
        />
      </header>

      <section
        className="documentation-page"
        aria-label={`${page.label} documentation`}
      >
        {children}
      </section>
    </article>
  );
}
