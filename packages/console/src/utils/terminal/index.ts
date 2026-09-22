/**
 * ANSI/process-output utility modules.
 *
 * These helpers are available through the secondary package entry point
 * `@moyarich/console/utils/terminal` without expanding the main package API.
 */
export { ANSI_CLEAR_LINE_PATTERN, ANSI_ESCAPE } from "./constants";
export { getAnsiTokenRanges } from "./getAnsiTokenRanges";
export { getAnsiTokenStyle } from "./getAnsiTokenStyle";
export { hasAnsiClearLine } from "./hasAnsiClearLine";
export { parseStrictJsonOutput } from "./parseStrictJsonOutput";
export { parseStructuredOutput } from "./parseStructuredOutput";
export type {
  AnserToken,
  AnsiTokenRange,
  ConsoleStructuredOutputParser,
  ConsoleStructuredOutputParserContext,
} from "./types";
