import { useEffect, useMemo, useState } from "react";
import { MonacoEditor } from "./components/MonacoEditor";
import {
  CONSOLE_EXAMPLES,
  DEFAULT_CONSOLE_EXAMPLE,
} from "./examples";

export function App() {
  const [exampleId, setExampleId] = useState(DEFAULT_CONSOLE_EXAMPLE.id);
  const [sourceFileName, setSourceFileName] = useState(
    DEFAULT_CONSOLE_EXAMPLE.sourceFiles[0].name,
  );

  const example =
    CONSOLE_EXAMPLES.find((candidate) => candidate.id === exampleId) ??
    DEFAULT_CONSOLE_EXAMPLE;
  const Example = example.Component;

  useEffect(() => {
    setSourceFileName(example.sourceFiles[0].name);
  }, [example.id, example.sourceFiles]);

  const sourceFile = useMemo(
    () =>
      example.sourceFiles.find((file) => file.name === sourceFileName) ??
      example.sourceFiles[0],
    [example.sourceFiles, sourceFileName],
  );

  return (
    <main className="app-shell">
      <header className="hero">
        <span className="eyebrow">@moyarich/console</span>
        <h1>Console transport playground</h1>
        <p>{example.description}</p>
      </header>

      <nav className="source-tabs" aria-label="Console example">
        {CONSOLE_EXAMPLES.map((candidate) => (
          <button
            key={candidate.id}
            className={candidate.id === example.id ? "active" : ""}
            onClick={() => setExampleId(candidate.id)}
          >
            {candidate.label}
          </button>
        ))}
      </nav>

      <Example />

      <section className="example-source-card" aria-label="Example source">
        <div className="example-source-header">
          <div>
            <span className="panel-kicker">Source</span>
            <strong>{sourceFile.name}</strong>
          </div>

          {example.sourceFiles.length > 1 && (
            <label className="source-file-select">
              <span>File</span>
              <select
                value={sourceFile.name}
                onChange={(event) => setSourceFileName(event.target.value)}
              >
                {example.sourceFiles.map((file) => (
                  <option key={file.name} value={file.name}>
                    {file.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="example-source-editor">
          <MonacoEditor
            path={example.id + "/" + sourceFile.name}
            language="typescript"
            value={sourceFile.source}
            options={{
              readOnly: true,
              domReadOnly: true,
              contextmenu: true,
              renderLineHighlight: "none",
            }}
          />
        </div>
      </section>
    </main>
  );
}
