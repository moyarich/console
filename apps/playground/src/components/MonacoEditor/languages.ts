// Standalone Monaco uses the base language IDs for JSX/TSX and JSONC.
// The model URI retains the extension so the workers parse the correct syntax.
const LANGUAGE_IDS: Readonly<Record<string, string>> = {
  ".cjs": "javascript",
  ".css": "css",
  ".htm": "html",
  ".html": "html",
  ".jav": "java",
  ".java": "java",
  ".js": "javascript",
  ".json": "json",
  ".jsonc": "json",
  ".jsx": "javascript",
  ".less": "less",
  ".mjs": "javascript",
  ".py": "python",
  ".pyi": "python",
  ".pyw": "python",
  ".scss": "scss",
  ".ts": "typescript",
  ".tsx": "typescript",
};

export function languageForPath(path: string) {
  const normalizedPath = path.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";

  for (const [extension, languageId] of Object.entries(LANGUAGE_IDS)) {
    if (normalizedPath.endsWith(extension)) {
      return languageId;
    }
  }

  return "plaintext";
}
