import { useState } from "react";
import { MonacoEditor } from "./components/MonacoEditor";
import {
  CONSOLE_EXAMPLES,
  DEFAULT_CONSOLE_EXAMPLE,
} from "./examples";

export function App() {
  const [exampleId, setExampleId] = useState(DEFAULT_CONSOLE_EXAMPLE.id);
  const example =
    CONSOLE_EXAMPLES.find((candidate) => candidate.id === exampleId) ??
    DEFAULT_CONSOLE_EXAMPLE;
  const Example = example.Component;

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
            Explore copy-paste React examples for page capture, iframe
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

            <label className="example-select-field" htmlFor="example-select">
              <span>Example</span>
              <select
                id="example-select"
                value={example.id}
                onChange={(event) => setExampleId(event.target.value)}
              >
                {CONSOLE_EXAMPLES.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="selected-example">
              <span className="selected-example-label">Selected</span>
              <h2>{example.label}</h2>
              <p>{example.description}</p>
              <code>{example.id}</code>
            </div>

            <div className="sidebar-note">
              Every source example is intended to be copied directly into a
              React app.
            </div>
          </aside>

          <div className="content-stack">
            <section className="playground-panel preview-panel">
              <div className="panel-toolbar">
                <div>
                  <span className="panel-kicker">Preview</span>
                  <strong>{example.label}</strong>
                </div>
                <span className="live-badge">
                  <span className="live-dot" aria-hidden="true" />
                  Live
                </span>
              </div>

              <div className="preview-stage">
                <Example />
              </div>
            </section>

            <section className="playground-panel source-panel" aria-label="Example source">
              <div className="panel-toolbar source-toolbar">
                <div>
                  <span className="panel-kicker">Source</span>
                  <strong>example.tsx</strong>
                </div>
                <span className="language-badge">TypeScript + React</span>
              </div>

              <div className="example-source-editor">
                <MonacoEditor
                  path={example.id + "/example.tsx"}
                  language="typescript"
                  value={example.exampleSource}
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    contextmenu: true,
                    renderLineHighlight: "none",
                  }}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <span>@moyarich/console</span>
        <span>React console UI and transport adapters</span>
      </footer>
    </div>
  );
}
