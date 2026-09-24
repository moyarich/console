import { Maximize2, X } from "lucide-react";
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ElementType, ErrorInfo, ReactNode } from "react";
import { createPortal } from "react-dom";
import { MonacoEditor } from "../MonacoEditor";
import {
  compileExampleProject,
  type CompiledExampleRuntime,
} from "./compileExampleProject";

export interface RunnableExampleProps {
  source: string;
  sourcePath?: string;
  files?: Readonly<Record<string, string>>;
  runtimeModules?: Readonly<Record<string, unknown>>;
  title?: string;
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

function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function createCanonicalFiles(
  source: string,
  sourcePath: string,
  files: Readonly<Record<string, string>>,
) {
  return Object.freeze({
    ...Object.fromEntries(
      Object.entries(files).map(([path, value]) => [normalizePath(path), value]),
    ),
    [normalizePath(sourcePath)]: source,
  });
}

function cloneFiles(files: Readonly<Record<string, string>>) {
  return { ...files };
}

function createProjectSignature(files: Readonly<Record<string, string>>) {
  return JSON.stringify(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function languageForPath(path: string) {
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";

  if (
    path.endsWith(".js") ||
    path.endsWith(".jsx") ||
    path.endsWith(".mjs") ||
    path.endsWith(".cjs")
  ) {
    return "javascript";
  }

  return "typescript";
}

export function RunnableExample({
  source,
  sourcePath = "example.tsx",
  files = {},
  runtimeModules,
  title = sourcePath,
}: RunnableExampleProps) {
  const reactId = useId();
  const instanceId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const previewDialogTitleId = `${instanceId}-preview-dialog-title`;
  const entryPath = normalizePath(sourcePath);
  const canonicalFiles = useMemo(
    () => createCanonicalFiles(source, entryPath, files),
    [entryPath, files, source],
  );
  const canonicalSignature = useMemo(
    () => createProjectSignature(canonicalFiles),
    [canonicalFiles],
  );
  const [draftFiles, setDraftFiles] = useState<Record<string, string>>(() =>
    cloneFiles(canonicalFiles),
  );
  const [activePath, setActivePath] = useState(entryPath);
  const [RuntimeComponent, setRuntimeComponent] =
    useState<ElementType | null>(null);
  const [runVersion, setRunVersion] = useState(0);
  const [compileError, setCompileError] = useState("");
  const [isCompiling, setIsCompiling] = useState(true);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const runTokenRef = useRef(0);
  const runtimeRef = useRef<CompiledExampleRuntime | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const replaceRuntime = useCallback((runtime: CompiledExampleRuntime) => {
    runtimeRef.current?.dispose();
    runtimeRef.current = runtime;
    setRuntimeComponent(() => runtime.Component);
    setRunVersion((current) => current + 1);
  }, []);

  const compileFiles = useCallback(
    async (
      nextFiles: Readonly<Record<string, string>>,
      token: number,
      nextEntryPath: string,
    ) => {
      setIsCompiling(true);
      setCompileError("");

      try {
        const runtime = await compileExampleProject({
          entryPath: nextEntryPath,
          files: nextFiles,
          runtimeModules,
        });

        if (token !== runTokenRef.current) {
          runtime.dispose();
          return;
        }

        replaceRuntime(runtime);
      } catch (error) {
        if (token !== runTokenRef.current) {
          return;
        }

        setCompileError(
          error instanceof Error
            ? error.message
            : "Unable to run this example.",
        );
      } finally {
        if (token === runTokenRef.current) {
          setIsCompiling(false);
        }
      }
    },
    [replaceRuntime, runtimeModules],
  );

  useEffect(() => {
    const nextFiles = cloneFiles(canonicalFiles);
    const token = ++runTokenRef.current;

    setDraftFiles(nextFiles);
    setActivePath(entryPath);
    setRuntimeComponent(null);
    setCompileError("");
    setPreviewFullscreen(false);
    runtimeRef.current?.dispose();
    runtimeRef.current = null;

    void compileFiles(nextFiles, token, entryPath);

    return () => {
      runTokenRef.current += 1;
    };
  }, [canonicalFiles, canonicalSignature, compileFiles, entryPath]);

  useEffect(
    () => () => {
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!previewFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const rootElement = rootRef.current;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewFullscreen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      requestAnimationFrame(() => {
        rootElement
          ?.querySelector<HTMLButtonElement>("[data-preview-expand]")
          ?.focus();
      });
    };
  }, [previewFullscreen]);

  const filePaths = Object.keys(draftFiles);
  const activeSource = draftFiles[activePath] ?? "";
  const dirty = createProjectSignature(draftFiles) !== canonicalSignature;
  const editorPath = `${instanceId}/${activePath}`;

  const runSource = () => {
    const token = ++runTokenRef.current;
    void compileFiles(cloneFiles(draftFiles), token, entryPath);
  };

  const resetSource = () => {
    // Always clone the immutable prop-derived baseline. Draft editor state is
    // never promoted to the reset baseline.
    const resetFiles = cloneFiles(canonicalFiles);
    const token = ++runTokenRef.current;

    setDraftFiles(resetFiles);
    setActivePath(entryPath);
    void compileFiles(resetFiles, token, entryPath);
  };

  const previewPanel = (
    <section
      className="playground-panel preview-panel"
      aria-label="Runnable example preview"
    >
      <div className="panel-toolbar preview-toolbar">
        <div>
          <span className="panel-kicker">Preview</span>
          <strong id={previewDialogTitleId}>{title}</strong>
        </div>

        <div className="preview-toolbar-actions">
          <span className="live-badge">
            <span className="live-dot" aria-hidden="true" />
            {isCompiling ? "Compiling" : "Runnable"}
          </span>
          <button
            ref={previewFullscreen ? closeButtonRef : undefined}
            data-preview-expand={previewFullscreen ? undefined : ""}
            type="button"
            className="panel-icon-button"
            aria-label={
              previewFullscreen
                ? "Close fullscreen preview"
                : "Open fullscreen preview"
            }
            title={previewFullscreen ? "Close preview" : "Fullscreen"}
            onClick={() => setPreviewFullscreen((current) => !current)}
          >
            {previewFullscreen ? (
              <X aria-hidden="true" />
            ) : (
              <Maximize2 aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="preview-stage">
        {compileError && (
          <div className="runtime-error compile-error" role="alert">
            <strong>Compile error</strong>
            <pre>{compileError}</pre>
          </div>
        )}

        {RuntimeComponent ? (
          <RuntimeErrorBoundary key={`${instanceId}-${runVersion}`}>
            <RuntimeComponent />
          </RuntimeErrorBoundary>
        ) : (
          !compileError && (
            <div className="preview-loading" role="status">
              Compiling preview…
            </div>
          )
        )}
      </div>
    </section>
  );

  return (
    <>
      <div ref={rootRef} className="content-stack">
        <section
          className="playground-panel source-panel"
          aria-label="Runnable example source"
        >
          <div className="panel-toolbar source-toolbar">
            <div>
              <span className="panel-kicker">Source</span>
              <strong>{activePath}</strong>
            </div>

            <div className="source-toolbar-actions">
              {dirty && <span className="draft-badge">Edited</span>}
              <button
                type="button"
                className="source-action-button"
                disabled={!dirty || isCompiling}
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

          {filePaths.length > 1 && (
            <div className="source-file-tabs" role="tablist" aria-label="Files">
              {filePaths.map((path) => (
                <button
                  key={path}
                  type="button"
                  role="tab"
                  aria-selected={path === activePath}
                  className={
                    path === activePath
                      ? "source-file-tab active"
                      : "source-file-tab"
                  }
                  onClick={() => setActivePath(path)}
                >
                  {path}
                </button>
              ))}
            </div>
          )}

          <div className="example-source-editor">
            <MonacoEditor
              key={editorPath}
              path={editorPath}
              language={languageForPath(activePath)}
              value={activeSource}
              onChange={(value) =>
                setDraftFiles((current) => ({
                  ...current,
                  [activePath]: value ?? "",
                }))
              }
              options={{
                contextmenu: true,
                renderLineHighlight: "line",
              }}
            />
          </div>
        </section>

        {previewFullscreen ? (
          <div className="preview-panel-placeholder" aria-hidden="true" />
        ) : (
          previewPanel
        )}
      </div>

      {previewFullscreen &&
        createPortal(
          <div
            className="preview-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPreviewFullscreen(false);
              }
            }}
          >
            <div
              className="preview-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={previewDialogTitleId}
            >
              {previewPanel}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
