export type RunnableProjectFiles = Readonly<Record<string, string>>;

export function normalizeRunnablePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function createRunnableProjectBaseline(
  source: string,
  sourcePath: string,
  files: RunnableProjectFiles,
): RunnableProjectFiles {
  const baseline = {
    ...Object.fromEntries(
      Object.entries(files).map(([path, value]) => [
        normalizeRunnablePath(path),
        value,
      ]),
    ),
    [normalizeRunnablePath(sourcePath)]: source,
  };

  return Object.freeze(baseline);
}

export function createRunnableProjectDraft(
  baseline: RunnableProjectFiles,
): Record<string, string> {
  return { ...baseline };
}

export function createRunnableProjectSignature(files: RunnableProjectFiles) {
  return JSON.stringify(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)),
  );
}
