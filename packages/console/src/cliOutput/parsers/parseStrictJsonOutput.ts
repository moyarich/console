/**
 * Parses only complete JSON object/array text.
 *
 * Scalar JSON values intentionally return undefined so ordinary terminal text
 * such as numbers, booleans, or quoted strings is not promoted unexpectedly.
 *
 * @param text Plain text candidate.
 * @returns Parsed object/array, or undefined when the text is not strict object/array JSON.
 */
export function parseStrictJsonOutput(text: string): object | undefined {
  const trimmedText = text.trim();

  if (
    !trimmedText ||
    (!trimmedText.startsWith("{") && !trimmedText.startsWith("["))
  ) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(trimmedText);

    return typeof value === "object" && value !== null ? value : undefined;
  } catch {
    return undefined;
  }
}
