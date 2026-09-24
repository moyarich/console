import { useState } from "react";
import { CONSOLE_API_SECTION } from "../../api";
import {
  CONSOLE_EXAMPLES,
  CONSOLE_EXAMPLE_GROUPS,
  DEFAULT_CONSOLE_EXAMPLE,
} from "../../examples";
import { PlaygroundMDXProvider } from "../../mdx/PlaygroundMDXProvider";
import { Sidebar } from "../Sidebar";
import { MdxPageSection } from "../Sidebar/sections/MdxPageSection";
import { ExamplesSection } from "../Sidebar/sections/ExamplesSection";

type PlaygroundSelection =
  | { type: "example"; id: string }
  | { type: "api"; id: string };

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
  const apiPage =
    CONSOLE_API_SECTION.pages.find(
      (candidate) => selection.type === "api" && candidate.id === selection.id,
    ) ?? CONSOLE_API_PAGES[0];

  const showingApi = selection.type === "api" && apiPage;
  const selectedPage = showingApi ? apiPage : example;
  const Page = selectedPage.Page;

  const exampleGroup =
    CONSOLE_EXAMPLE_GROUPS.find((group) => group.id === example.groupId) ??
    CONSOLE_EXAMPLE_GROUPS[0];

  const eyebrow = showingApi ? "API reference" : "Interactive playground";
  const title = showingApi
    ? selectedPage.label
    : "Edit, run, and inspect console examples.";
  const description = showingApi
    ? selectedPage.description
    : "Browse the library by capability, edit the source in Monaco, and run each example against the live preview.";
  const pathLabel = showingApi ? "API" : (exampleGroup?.label ?? example.groupId);

  return (
    <div className="layout-content">
      <aside className="layout-sidebar documentation-sidebar">
        <Sidebar aria-label="Console documentation">
          <ExamplesSection
            examples={CONSOLE_EXAMPLES}
            value={selection.type === "example" ? selection.id : undefined}
            onChange={(id) => setSelection({ type: "example", id })}
          />
          <MdxPageSection
            section={CONSOLE_API_SECTION}
            value={selection.type === "api" ? selection.id : undefined}
            onChange={(id) => setSelection({ type: "api", id })}
          />
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
