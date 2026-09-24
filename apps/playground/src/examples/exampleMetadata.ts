export interface ConsoleExampleMeta {
  label: string;
  description?: string;
  [key: string]: unknown;
}

export function parseConsoleExampleMeta(
  value: unknown,
  sourcePath: string,
): ConsoleExampleMeta {
  if (!value || typeof value !== "object") {
    throw new Error(
      `Missing frontmatter metadata in ${sourcePath}. Expected at least a non-empty "label".`,
    );
  }

  const metadata = value as Record<string, unknown>;

  if (typeof metadata.label !== "string" || metadata.label.trim() === "") {
    throw new Error(
      `Invalid frontmatter metadata in ${sourcePath}: "label" must be a non-empty string.`,
    );
  }

  if (
    metadata.description !== undefined &&
    typeof metadata.description !== "string"
  ) {
    throw new Error(
      `Invalid frontmatter metadata in ${sourcePath}: "description" must be a string when provided.`,
    );
  }

  return metadata as ConsoleExampleMeta;
}
