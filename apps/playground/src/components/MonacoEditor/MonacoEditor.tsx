import Editor, { type EditorProps } from "@monaco-editor/react";

export type MonacoEditorProps = EditorProps;

const DEFAULT_OPTIONS: NonNullable<EditorProps["options"]> = {
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

export function MonacoEditor({
  theme = "vs-dark",
  loading = <div className="editor-loading">Loading editor…</div>,
  options,
  ...props
}: MonacoEditorProps) {
  return (
    <Editor
      {...props}
      theme={theme}
      loading={loading}
      options={{
        ...DEFAULT_OPTIONS,
        ...options,
      }}
    />
  );
}
