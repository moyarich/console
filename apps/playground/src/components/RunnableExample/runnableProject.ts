export type RunnableProjectFiles = Readonly<Record<string, string>>;

export function normalizeRunnablePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function createCanonicalProjectFiles(
  source: string,
  sourcePath: string,
  files: RunnableProjectFiles = {},
): RunnableProjectFiles {
  const entries = Object.entries(files).map(([path, value]) => [
    normalizeRunnablePath(path),
    value,
  ]);

  return Object.freeze({
    ...Object.fromEntries(entries),
    [normalizeRunnablePath(sourcePath)]: source,
  });
}

export function cloneRunnableProjectFiles(
  files: RunnableProjectFiles,
): Record<string, string> {
  return { ...files };
}

export function createRunnableProjectSignature(files: RunnableProjectFiles) {
  return JSON.stringify(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)),
  );
}
