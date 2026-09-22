import type {
  ConsoleOutputStream,
  ConsoleProcessOutputMetadata,
  ConsoleStdoutEntry,
} from "../types";

/** Metadata supplied to custom structured-output parsers. */
export interface ConsoleStructuredOutputParserContext {
  /** Logical CLI-output entry after core CR/newline normalization. */
  entry: ConsoleStdoutEntry | string;
  /** Zero-based entry index. */
  index: number;
  /** Stable entry id when one was supplied. */
  id?: string;
  /** stdout/stderr metadata when one was supplied. */
  stream?: ConsoleOutputStream;
  /** Metadata accumulated by CLI-output processors. */
  metadata?: ConsoleProcessOutputMetadata;
}

/**
 * Parses an ANSI-stripped CLI-output line into a structured value.
 *
 * Return `undefined` to allow another parser or normal ANSI rendering.
 */
export type ConsoleStructuredOutputParser = (
  text: string,
  context: ConsoleStructuredOutputParserContext,
) => unknown | undefined;
