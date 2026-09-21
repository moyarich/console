import { useState } from "react";
import { ExamplePicker } from "./components/ExamplePicker/ExamplePicker";
import { RunnableExample } from "./components/RunnableExample";
import { CONSOLE_EXAMPLES, DEFAULT_CONSOLE_EXAMPLE } from "./examples";

export function App() {
  const [exampleId, setExampleId] = useState(DEFAULT_CONSOLE_EXAMPLE.id);
  const example =
    CONSOLE_EXAMPLES.find((candidate) => candidate.id === exampleId) ??
    DEFAULT_CONSOLE_EXAMPLE;

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

      <main className="playground-shell">
        <section className="hero">
          <span className="eyebrow">Interactive playground</span>
          <h1>Inspect console output without leaving your app.</h1>
          <p>
            Edit and run copy-paste React examples for page capture, iframe
            transport, WebSocket transport, and migration from console-feed.
          </p>
        </section>

        <div className="playground-grid">
          <aside className="example-sidebar">
            <div className="sidebar-heading">
              <div>
                <span className="panel-kicker">Examples</span>
                <strong>Choose a pattern</strong>
              </div>
              <span className="example-count">{CONSOLE_EXAMPLES.length}</span>
            </div>

            <ExamplePicker
              examples={CONSOLE_EXAMPLES}
              value={example.id}
              onChange={setExampleId}
            />

            <div className="selected-example">
              <span className="selected-example-label">Selected</span>
              <h2>{example.label}</h2>
              <p>{example.description}</p>
              <code>{example.id}</code>
            </div>

          </aside>

          <RunnableExample example={example} />
        </div>
      </main>

      <footer className="site-footer">
        <span>@moyarich/console</span>
        <span>React console UI and transport adapters</span>
      </footer>
    </div>
  );
}
