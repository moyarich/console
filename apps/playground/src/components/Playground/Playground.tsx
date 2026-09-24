import { useState } from "react";
import { DOCUMENTATION_SECTIONS } from "../../utils/documentationSections";
import {
  CONSOLE_EXAMPLES,
  CONSOLE_EXAMPLE_GROUPS,
  DEFAULT_CONSOLE_EXAMPLE,
} from "../../examples";
import { PlaygroundMDXProvider } from "../../mdx/PlaygroundMDXProvider";
import { Sidebar } from "../Sidebar";
import { ExamplesSection } from "../Sidebar/sections/ExamplesSection";
import { MdxPageSection } from "../Sidebar/sections/MdxPageSection";

type PlaygroundSelection =
  | { type: "example"; id: string }
  | { type: "documentation"; sectionId: string; id: string };

export function Playground() {
  const [selection, setSelection] = useState<PlaygroundSelection>({
    type: "example",
    id: DEFAULT_CONSOLE_EXAMPLE.id,
  });

  const example =
    CONSOLE_EXAMPLES.find(
      (candidate) =>
        selection.type === "example" && candidate.id === selection.id,
    ) ?? DEFAULT_CONSOLE_EXAMPLE;

  const documentationSection =
    selection.type === "documentation"
      ? DOCUMENTATION_SECTIONS.find(
          (section) => section.id === selection.sectionId,
        )
      : undefined;
  const documentationPage =
    selection.type === "documentation"
      ? (documentationSection?.getPage(selection.id) ??
        documentationSection?.defaultPage)
      : undefined;

  const showingDocumentation = Boolean(
    documentationSection && documentationPage,
  );
  const selectedPage = showingDocumentation ? documentationPage! : example;
  const Page = selectedPage.Page;

  const exampleGroup =
    CONSOLE_EXAMPLE_GROUPS.find((group) => group.id === example.groupId) ??
    CONSOLE_EXAMPLE_GROUPS[0];

  const eyebrow = showingDocumentation
    ? documentationSection!.label
    : "Interactive playground";
  const title = showingDocumentation
    ? selectedPage.label
    : "Edit, run, and inspect console examples.";
  const description = showingDocumentation
    ? selectedPage.description
    : "Browse the library by capability, edit the source in Monaco, and run each example against the live preview.";
  const pathLabel = showingDocumentation
    ? documentationSection!.label
    : (exampleGroup?.label ?? example.groupId);

  return (
    <div className="layout-content">
      <aside className="layout-sidebar documentation-sidebar">
        <Sidebar aria-label="Console documentation">
          <ExamplesSection
            examples={CONSOLE_EXAMPLES}
            value={selection.type === "example" ? selection.id : undefined}
            onChange={(id) => setSelection({ type: "example", id })}
          />

          {DOCUMENTATION_SECTIONS.map((section) => (
            <MdxPageSection
              key={section.id}
              section={section}
              value={
                selection.type === "documentation" &&
                selection.sectionId === section.id
                  ? selection.id
                  : undefined
              }
              onChange={(id) =>
                setSelection({
                  type: "documentation",
                  sectionId: section.id,
                  id,
                })
              }
            />
          ))}
        </Sidebar>
      </aside>

      <main className="layout-main">
        <section className="hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}

          <div className="hero-example-path" aria-label="Selected page">
            <span>{pathLabel}</span>
            <span aria-hidden="true">/</span>
            <strong>{selectedPage.label}</strong>
          </div>
        </section>

        <section
          className="documentation-page"
          aria-label={`${selectedPage.label} documentation`}
        >
          <PlaygroundMDXProvider pageTitle={selectedPage.label}>
            <Page />
          </PlaygroundMDXProvider>
        </section>
      </main>
    </div>
  );
}
