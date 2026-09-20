import { Component, useEffect, useRef, useState } from "react";
import type {
  ComponentType,
  ErrorInfo,
  ReactNode,
} from "react";
import type { ConsoleExample } from "../../examples";
import { MonacoEditor } from "../MonacoEditor";
import { compileExampleSource } from "./compileExampleSource";

interface RunnableExampleProps {
  example: ConsoleExample;
}

interface RuntimeErrorBoundaryProps {
  children: ReactNode;
}

interface RuntimeErrorBoundaryState {
  error: Error | null;
}

class RuntimeErrorBoundary extends Component<
  RuntimeErrorBoundaryProps,
  RuntimeErrorBoundaryState
> {
  state: RuntimeErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RuntimeErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Runnable example failed", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="runtime-error" role="alert">
          <strong>Runtime error</strong>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RunnableExample({ example }: RunnableExampleProps) {
  const [draftSource, setDraftSource] = useState(example.exampleSource);
  const [RuntimeComponent, setRuntimeComponent] = useState<ComponentType>(
    () => example.Component,
  );
  const [runVersion, setRunVersion] = useState(0);
  const [compileError, setCompileError] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [hasCustomRuntime, setHasCustomRuntime] = useState(false);
  const runTokenRef = useRef(0);

  useEffect(() => {
    runTokenRef.current += 1;
    setDraftSource(example.exampleSource);
    setRuntimeComponent(() => example.Component);
    setRunVersion((current) => current + 1);
    setCompileError("");
    setIsCompiling(false);
    setHasCustomRuntime(false);
  }, [example]);

  const dirty = draftSource !== example.exampleSource;

  const runSource = async () => {
    const runToken = ++runTokenRef.current;
    setIsCompiling(true);
    setCompileError("");

    try {
      const ComponentFromSource = await compileExampleSource(
        draftSource,
        `${example.id}/example.tsx`,
      );

      if (runToken !== runTokenRef.current) {
        return;
      }

      setRuntimeComponent(() => ComponentFromSource);
      setRunVersion((current) => current + 1);
      setHasCustomRuntime(true);
    } catch (error) {
      if (runToken !== runTokenRef.current) {
        return;
      }

      setCompileError(
        error instanceof Error ? error.message : "Unable to run this example.",
      );
    } finally {
      if (runToken === runTokenRef.current) {
        setIsCompiling(false);
      }
    }
  };

  const resetSource = () => {
    runTokenRef.current += 1;
    setDraftSource(example.exampleSource);
    setRuntimeComponent(() => example.Component);
    setRunVersion((current) => current + 1);
    setCompileError("");
    setIsCompiling(false);
    setHasCustomRuntime(false);
  };

  return (
    <div className="content-stack">
      <section
        className="playground-panel source-panel"
        aria-label="Runnable example source"
      >
        <div className="panel-toolbar source-toolbar">
          <div>
            <span className="panel-kicker">Source</span>
            <strong>example.tsx</strong>
          </div>

          <div className="source-toolbar-actions">
            {dirty && <span className="draft-badge">Edited</span>}
            <button
              type="button"
              className="source-action-button"
              disabled={!dirty && !hasCustomRuntime}
              onClick={resetSource}
            >
              Reset
            </button>
            <button
              type="button"
              className="source-action-button run-source-button"
              disabled={isCompiling}
              onClick={runSource}
            >
              {isCompiling ? "Running…" : "Run"}
            </button>
          </div>
        </div>

        <div className="example-source-editor">
          <MonacoEditor
            path={example.id + "/example.tsx"}
            language="typescript"
            value={draftSource}
            onChange={(value) => setDraftSource(value ?? "")}
            options={{
              contextmenu: true,
              renderLineHighlight: "line",
            }}
          />
        </div>
      </section>

      <section className="playground-panel preview-panel">
        <div className="panel-toolbar">
          <div>
            <span className="panel-kicker">Preview</span>
            <strong>{example.label}</strong>
          </div>
          <span className="live-badge">
            <span className="live-dot" aria-hidden="true" />
            Runnable
          </span>
        </div>

        <div className="preview-stage">
          {compileError && (
            <div className="runtime-error compile-error" role="alert">
              <strong>Compile error</strong>
              <pre>{compileError}</pre>
            </div>
          )}

          <RuntimeErrorBoundary
            key={`${example.id}-${runVersion}`}
          >
            <RuntimeComponent />
          </RuntimeErrorBoundary>
        </div>
      </section>
    </div>
  );
}
