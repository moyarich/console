import type Anser from "anser";
import type {
  ConsoleStructuredOutputParser as CoreConsoleStructuredOutputParser,
  ConsoleStructuredOutputParserContext as CoreConsoleStructuredOutputParserContext,
} from "../../addons";

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
export type ConsoleStructuredOutputParserContext =
  CoreConsoleStructuredOutputParserContext;

/**
 * Parses an ANSI-stripped process-output line into a structured value.
 *
 * Return `undefined` to allow another parser or normal ANSI rendering.
 */
export type ConsoleStructuredOutputParser = CoreConsoleStructuredOutputParser;
