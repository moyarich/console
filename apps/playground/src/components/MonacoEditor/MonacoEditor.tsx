import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import type * as monaco from "monaco-editor";
import type {
  EditorAppConfig,
  TextContents,
} from "monaco-languageclient/editorApp";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { vscodeApiConfig } from "./setup";

export interface MonacoEditorProps {
  path?: string;
  language?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  theme?: string;
  loading?: ReactNode;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  height?: string | number;
  width?: string | number;
}

const DEFAULT_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 14,
  lineHeight: 22,
  lineNumbersMinChars: 3,
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: false,
  wordWrap: "on",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  folding: true,
  glyphMargin: false,
  stickyScroll: { enabled: false },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  renderLineHighlight: "line",
  padding: { top: 16, bottom: 16 },
};

function toEditorUri(path: string) {
  return `file:///workspace/${path.replace(/^\/+/, "")}`;
}

export function MonacoEditor({
  path = "example.tsx",
  language = "typescriptreact",
  value = "",
  onChange,
  theme = "vs-dark",
  loading = <div className="editor-loading">Loading editor…</div>,
  options,
  height = "100%",
  width = "100%",
}: MonacoEditorProps) {
  const currentTextRef = useRef(value);
  const [configVersion, setConfigVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (value === currentTextRef.current) {
      return;
    }

    currentTextRef.current = value;
    setConfigVersion((current) => current + 1);
  }, [value]);

  const editorAppConfig = useMemo<EditorAppConfig>(
    () => ({
      codeResources: {
        modified: {
          text: value,
          uri: toEditorUri(path),
          enforceLanguageId: language,
        },
      },
      editorOptions: {
        ...DEFAULT_OPTIONS,
        ...options,
        theme,
      },
    }),
    [language, options, path, theme, value],
  );

  const handleTextChanged = ({ modified }: TextContents) => {
    if (modified === undefined) {
      return;
    }

    currentTextRef.current = modified;
    onChange?.(modified);
  };

  return (
    <div style={{ height, width, position: "relative" }}>
      {!ready && !error && (
        <div
          style={{
            inset: 0,
            position: "absolute",
            zIndex: 1,
          }}
        >
          {loading}
        </div>
      )}

      {error && (
        <div className="runtime-error" role="alert">
          <strong>Editor error</strong>
          <pre>{error.message}</pre>
        </div>
      )}

      <MonacoEditorReactComp
        vscodeApiConfig={vscodeApiConfig}
        editorAppConfig={editorAppConfig}
        triggerReprocessConfig={configVersion}
        style={{ height: "100%" }}
        onEditorStartDone={() => setReady(true)}
        onTextChanged={handleTextChanged}
        onError={setError}
      />
    </div>
  );
}
