import Anser from "anser";
import type {
  ConsoleProcessOutputMetadata,
  ConsoleStdoutEntry,
} from "../types";
import { parseStrictJsonOutput } from "./parseStrictJsonOutput";
import type { ConsoleStructuredOutputParser } from "./types";

/**
 * Runs custom structured-output parsers before optional strict JSON parsing.
 *
 * Parser exceptions are contained so extension code cannot prevent the
 * original process output from rendering.
 *
 * @param data ANSI-encoded output data.
 * @param entry Original normalized process-output entry.
 * @param index Zero-based entry index.
 * @param shouldParseStrictJson Whether to use the built-in object/array JSON parser.
 * @param parsers Ordered custom parsers.
 * @param processMetadata Metadata accumulated by process-output processors.
 * @returns The first structured value produced, or undefined for normal ANSI rendering.
 */
export function parseStructuredOutput(
  data: string,
  entry: ConsoleStdoutEntry | string,
  index: number,
  shouldParseStrictJson: boolean,
  parsers: readonly ConsoleStructuredOutputParser[] | undefined,
  processMetadata: ConsoleProcessOutputMetadata,
): unknown | undefined {
  const text = Anser.ansiToText(data);
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
