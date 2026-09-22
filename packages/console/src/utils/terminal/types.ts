import type Anser from "anser";
import type {
  ConsoleOutputStream,
  ConsoleProcessOutputMetadata,
  ConsoleStdoutEntry,
} from "../../processOutput";

/** One token produced by Anser's ANSI parser. */
export type AnserToken = ReturnType<typeof Anser.ansiToJson>[number];

/** An ANSI token plus its start/end offsets in ANSI-stripped text. */
export interface AnsiTokenRange {
  /** Parsed Anser token. */
  token: AnserToken;
  /** Inclusive source offset in visible text. */
  start: number;
  /** Exclusive source offset in visible text. */
  end: number;
}

/** Metadata supplied to custom terminal structured-output parsers. */
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
 * Parses an ANSI-stripped process-output line into a structured value.
 *
 * Return `undefined` to allow another parser or normal ANSI rendering.
 */
export type ConsoleStructuredOutputParser = (
  text: string,
  context: ConsoleStructuredOutputParserContext,
) => unknown | undefined;
