import type {
  ConsoleOutputStream,
  ConsoleProcessOutputMetadata,
  ConsoleStdoutEntry,
} from "../../processOutput";
import { stripAnsiText } from "./ansi";

/** Metadata supplied to structured-output parsers. */
export interface ConsoleStructuredOutputParserContext {
  /** Logical process-output entry after core CR/newline normalization. */
  entry: ConsoleStdoutEntry | string;
  /** Zero-based entry index. */
  index: number;
  /** Stable entry id when one was supplied. */
  id?: string;
  /** stdout/stderr metadata when one was supplied. */
  stream?: ConsoleOutputStream;
  /** Metadata accumulated by process-output processors. */
  metadata?: ConsoleProcessOutputMetadata;
}

/**
 * Parses a plain-text ANSI line into a structured value.
 *
 * Return `undefined` to leave the line as ANSI text or allow another parser
 * to handle it.
 */
export type ConsoleStructuredOutputParser = (
  text: string,
  context: ConsoleStructuredOutputParserContext,
) => unknown | undefined;

/** Parses only complete JSON object/array text, never scalar JSON values. */
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

/** Runs custom structured parsers before the optional strict JSON parser. */
export function parseStructuredOutput(
  data: string,
  entry: ConsoleStdoutEntry | string,
  index: number,
  shouldParseStrictJson: boolean,
  parsers: readonly ConsoleStructuredOutputParser[] | undefined,
  processMetadata: ConsoleProcessOutputMetadata,
): unknown | undefined {
  const text = stripAnsiText(data);
  const context =
    typeof entry === "string"
      ? { entry, index, metadata: processMetadata }
      : {
          entry,
          index,
          id: entry.id,
          stream: entry.stream,
          metadata: processMetadata,
        };

  for (const parser of parsers ?? []) {
    try {
      const value = parser(text, context);

      if (value !== undefined) {
        return value;
      }
    } catch {
      // A custom parser must not prevent the original output from rendering.
    }
  }

  return shouldParseStrictJson ? parseStrictJsonOutput(text) : undefined;
}
