import { useState } from "react";
import {
  CONSOLE_EXAMPLES,
  CONSOLE_EXAMPLE_GROUPS,
  DEFAULT_CONSOLE_EXAMPLE,
} from "../../examples";
import { ExampleSidebar } from "../ExampleSidebar/ExampleSidebar";
import { RunnableExample, type RunnableExampleProps } from "../RunnableExample";

export function Playground() {
  const [exampleId, setExampleId] = useState(DEFAULT_CONSOLE_EXAMPLE.id);
  const example =
    CONSOLE_EXAMPLES.find((candidate) => candidate.id === exampleId) ??
    DEFAULT_CONSOLE_EXAMPLE;
  const exampleGroup =
    CONSOLE_EXAMPLE_GROUPS.find((group) => group.id === example.groupId) ??
    CONSOLE_EXAMPLE_GROUPS[0];
  const ExamplePage = example.Page;

  return (
    <div className="documentation-layout">
      <aside className="documentation-sidebar">
        <ExampleSidebar
          examples={CONSOLE_EXAMPLES}
          value={example.id}
          onChange={setExampleId}
        />
      </aside>

      <main className="playground-main">
        <section className="hero">
          <span className="eyebrow">Interactive playground</span>
          <h1>Edit, run, and inspect console examples.</h1>
          <p>
            Browse the library by capability, edit the source in Monaco, and run
            each example against the live preview.
          </p>

          <div className="hero-example-path" aria-label="Selected example">
            <span>{exampleGroup?.label ?? example.groupId}</span>
            <span aria-hidden="true">/</span>
            <strong>{example.label}</strong>
          </div>
        </section>

        <section
          className="example-documentation"
          aria-label={`${example.label} documentation`}
        >
          <ExamplePage
            components={{
              RunnableExample: (props: RunnableExampleProps) => (
                <RunnableExample title={example.label} {...props} />
              ),
            }}
          />
        </section>

        <footer className="site-footer">
          <span>@moyarich/console</span>
          <span>React console UI and transport adapters</span>
        </footer>
      </main>
    </div>
  );
}
