const LANGUAGE_IDS: Readonly<Record<string, string>> = {
  ".cjs": "javascript",
  ".css": "css",
  ".htm": "html",
  ".html": "html",
  ".js": "javascript",
  ".json": "json",
  ".jsonc": "jsonc",
  ".jsx": "javascriptreact",
  ".less": "less",
  ".mjs": "javascript",
  ".scss": "scss",
  ".ts": "typescript",
  ".tsx": "typescriptreact",
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
