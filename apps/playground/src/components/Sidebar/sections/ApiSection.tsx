import type { ConsoleApiPage } from "../../../api";

interface ApiSectionProps {
  pages: readonly ConsoleApiPage[];
  value?: string;
  onChange: (id: string) => void;
}

export function ApiSection({ pages, value, onChange }: ApiSectionProps) {
  return (
    <section className="sidebar-section" aria-labelledby="sidebar-api-title">
      <div className="sidebar-section-header">
        <div className="sidebar-section-heading">
          <strong id="sidebar-api-title">API</strong>
          <span className="sidebar-count">{pages.length}</span>
        </div>
      </div>

      <div className="sidebar-section-items">
        {pages.map((page) => {
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
