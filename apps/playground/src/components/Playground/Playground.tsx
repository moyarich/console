import "./Playground.css";
import { useEffect, useRef, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MdxPage } from "@src/mdx/MdxPage";
import { PlaygroundMDXProvider } from "@src/mdx/PlaygroundMDXProvider";
import {
  DEFAULT_PLAYGROUND_PATH,
  resolvePlaygroundRoute,
} from "@src/playground-registry";
import { buildPlaygroundPath } from "@src/utils/playgroundRouting";
import { PACKAGE_NAVIGATION } from "@src/playground-registry/package-sections";
import { REPOSITORY_DOCS_SECTIONS } from "@src/playground-registry/repository-docs-sections";
import type { PackageNavigationItem } from "@src/playground-registry/packageNavigation";
import type { MdxSection } from "@src/utils/mdxSection";
import { Sidebar } from "@src/components/Sidebar";
import { MdxPageSection } from "@src/components/Sidebar/sections/MdxPageSection";

export function Playground() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const route = resolvePlaygroundRoute(location.pathname);
  const routePageId = route?.page.id;
  const routeOutlineId = route?.outline?.id;

  useEffect(() => {
    if (!routePageId) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (routeOutlineId) {
        document
          .getElementById(routeOutlineId)
          ?.scrollIntoView({ block: "start" });
        return;
      }

      mainRef.current?.scrollTo({ top: 0 });
    });

    return () => cancelAnimationFrame(frame);
  }, [routeOutlineId, routePageId]);

  if (!route) {
    return <Navigate to={DEFAULT_PLAYGROUND_PATH} replace />;
  }

  const canonicalPath = buildPlaygroundPath(
    route.section.id,
    route.page.id,
    route.outline?.id,
  );
  if (location.pathname !== canonicalPath) {
    return <Navigate to={canonicalPath} replace />;
  }

  const { section, page: selectedPage, outline } = route;
  const Page = selectedPage.Page;

  function navigateToPage(
    sectionId: string,
    pageId: string,
    outlineId?: string,
  ) {
    navigate(buildPlaygroundPath(sectionId, pageId, outlineId));
  }

  function renderSection(documentationSection: MdxSection) {
    return (
      <MdxPageSection
        key={documentationSection.id}
        section={documentationSection}
        value={
          section.id === documentationSection.id ? selectedPage.id : undefined
        }
        outlineValue={
          section.id === documentationSection.id ? outline?.id : undefined
        }
        onChange={(id, outlineId) =>
          navigateToPage(documentationSection.id, id, outlineId)
        }
      />
    );
  }

  return (
    <div className="layout-content">
      <aside className="layout-sidebar documentation-sidebar">
        <Sidebar aria-label="Console documentation">
          <PackageNavigation
            items={PACKAGE_NAVIGATION}
            renderSection={renderSection}
          />
          {renderSection(REPOSITORY_DOCS_SECTIONS)}
        </Sidebar>
      </aside>

      <main className="layout-main" ref={mainRef}>
        <MdxPage
          key={`${section.id}/${selectedPage.id}`}
          section={section}
          page={selectedPage}
          activeOutlineId={outline?.id}
        >
          <PlaygroundMDXProvider pageTitle={selectedPage.label}>
            <Page />
          </PlaygroundMDXProvider>
        </MdxPage>
      </main>
    </div>
  );
}

function PackageNavigation({
  items,
  renderSection,
}: {
  items: readonly PackageNavigationItem[];
  renderSection: (section: MdxSection) => ReactNode;
}) {
  return (
    <>
      {items.map((item) =>
        item.type === "package" ? (
          renderSection(item.section)
        ) : (
          <section
            className="sidebar-package-directory"
            key={item.id}
            aria-label={item.label}
          >
            <strong className="sidebar-package-directory-title">
              {item.label}
            </strong>
            <div className="sidebar-package-directory-children">
              <PackageNavigation
                items={item.items}
                renderSection={renderSection}
              />
            </div>
          </section>
        ),
      )}
    </>
  );
}
