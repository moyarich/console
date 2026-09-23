import { useState } from "react";
import { ExampleSidebar } from "./components/ExampleSidebar/ExampleSidebar";
import { RunnableExample } from "./components/RunnableExample";
import {
  CONSOLE_EXAMPLES,
  CONSOLE_EXAMPLE_GROUPS,
  DEFAULT_CONSOLE_EXAMPLE,
} from "./examples";

export function App() {
  const [exampleId, setExampleId] = useState(DEFAULT_CONSOLE_EXAMPLE.id);
  const example =
    CONSOLE_EXAMPLES.find((candidate) => candidate.id === exampleId) ??
    DEFAULT_CONSOLE_EXAMPLE;
  const exampleGroup =
    CONSOLE_EXAMPLE_GROUPS.find((group) => group.id === example.groupId) ??
    CONSOLE_EXAMPLE_GROUPS[0];

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark" aria-hidden="true">
            &gt;_
          </span>
          <span className="brand-copy">
            <strong>@moyarich/console</strong>
            <small>React developer console</small>
          </span>
        </a>

        <a
          className="topbar-link"
          href="https://github.com/moyarich/console"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

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
              Browse the library by capability, edit the source in Monaco, and
              run each example against the live preview.
            </p>

            <div className="hero-example-path" aria-label="Selected example">
              <span>{exampleGroup?.label ?? example.groupId}</span>
              <span aria-hidden="true">/</span>
              <strong>{example.label}</strong>
            </div>
          </section>

          <RunnableExample example={example} />

          <footer className="site-footer">
            <span>@moyarich/console</span>
            <span>React console UI and transport adapters</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
