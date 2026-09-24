import { useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  CONSOLE_EXAMPLE_SECTION,
  DEFAULT_CONSOLE_EXAMPLE,
} from "../../examples";
import { MdxPage } from "../../mdx/MdxPage";
import { PlaygroundMDXProvider } from "../../mdx/PlaygroundMDXProvider";
import { DOCUMENTATION_SECTIONS } from "../../utils/documentationSections";
import {
  buildPlaygroundPath,
  resolvePlaygroundPath,
} from "../../utils/playgroundRouting";
import { Sidebar } from "../Sidebar";
import { ExamplesSection } from "../Sidebar/sections/ExamplesSection";
import { MdxPageSection } from "../Sidebar/sections/MdxPageSection";

const PLAYGROUND_SECTIONS = [
  CONSOLE_EXAMPLE_SECTION,
  ...DOCUMENTATION_SECTIONS,
] as const;

const DEFAULT_PLAYGROUND_PATH = buildPlaygroundPath(
  CONSOLE_EXAMPLE_SECTION.id,
  DEFAULT_CONSOLE_EXAMPLE.id,
);

export function Playground() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const route = resolvePlaygroundPath(location.pathname, PLAYGROUND_SECTIONS);
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

  const { section, page: selectedPage, outline } = route;
  const showingExamples = section.id === CONSOLE_EXAMPLE_SECTION.id;
  const Page = selectedPage.Page;

  function navigateToPage(
    sectionId: string,
    pageId: string,
    outlineId?: string,
  ) {
    navigate(buildPlaygroundPath(sectionId, pageId, outlineId));
  }

  return (
    <div className="layout-content">
      <aside className="layout-sidebar documentation-sidebar">
        <Sidebar aria-label="Console documentation">
          <ExamplesSection
            section={CONSOLE_EXAMPLE_SECTION}
            value={showingExamples ? selectedPage.id : undefined}
            outlineValue={showingExamples ? outline?.id : undefined}
            onChange={(id, outlineId) =>
              navigateToPage(CONSOLE_EXAMPLE_SECTION.id, id, outlineId)
            }
          />

          {DOCUMENTATION_SECTIONS.map((documentationSection) => (
            <MdxPageSection
              key={documentationSection.id}
              section={documentationSection}
              value={
                section.id === documentationSection.id
                  ? selectedPage.id
                  : undefined
              }
              outlineValue={
                section.id === documentationSection.id ? outline?.id : undefined
              }
              onChange={(id, outlineId) =>
                navigateToPage(documentationSection.id, id, outlineId)
              }
            />
          ))}
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
