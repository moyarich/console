export interface ConsoleExampleMeta {
  label: string;
  description: string;
}

export function parseConsoleExampleMeta(
  value: unknown,
  sourcePath: string,
): ConsoleExampleMeta {
  if (!value || typeof value !== "object") {
    throw new Error(
      `Missing meta export in ${sourcePath}. Expected export const meta = { label, description }.`,
    );
  }

  const metadata = value as Record<string, unknown>;

  if (typeof metadata.label !== "string" || metadata.label.trim() === "") {
    throw new Error(
      `Invalid meta export in ${sourcePath}: "label" must be a non-empty string.`,
    );
  }

  if (
    typeof metadata.description !== "string" ||
    metadata.description.trim() === ""
  ) {
    throw new Error(
      `Invalid meta export in ${sourcePath}: "description" must be a non-empty string.`,
    );
  }

  return value as ConsoleExampleMeta;
}
