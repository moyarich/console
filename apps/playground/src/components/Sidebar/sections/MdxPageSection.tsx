import type { MdxSection } from "../../../utils/mdxSection";

interface MdxPageSectionProps {
  section: MdxSection;
  value?: string;
  onChange: (id: string) => void;
}

export function MdxPageSection({
  section,
  value,
  onChange,
}: MdxPageSectionProps) {
  const headingId = `sidebar-${section.id}-title`;

  return (
    <section className="sidebar-section" aria-labelledby={headingId}>
      <div className="sidebar-section-header">
        <div className="sidebar-section-heading">
          <strong id={headingId}>{section.label}</strong>
          <span className="sidebar-count">{section.pages.length}</span>
        </div>
      </div>

      <div className="sidebar-section-items">
        {section.pages.map((page) => {
          const active = page.id === value;

          return (
            <button
              key={page.id}
              type="button"
              className="sidebar-item"
              aria-current={active ? "page" : undefined}
              title={page.description}
              onClick={() => onChange(page.id)}
            >
              <span>{page.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
