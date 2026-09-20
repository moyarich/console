import { useState } from "react";
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
    </main>
  );
}
