import type { ConsoleLink } from "../../links/types";
import type {
  ConsoleOutputStream,
  ConsoleProcessOutput,
  ConsoleStdoutEntry,
} from "../types";

/** Context supplied to each CLI-output processor. */
export interface ConsoleProcessOutputProcessorContext {
  /** Logical CLI-output entry after core CR/newline normalization. */
  readonly entry: ConsoleStdoutEntry | string;
  /** Zero-based entry index. */
  readonly index: number;
  /** ANSI-stripped text for the current transformed data. */
  readonly text: string;
  /** Stable entry id when one was supplied. */
  readonly id?: string;
  /** stdout/stderr metadata when one was supplied. */
  readonly stream?: ConsoleOutputStream;
}

/** Patch returned by a CLI-output processor. */
export interface ConsoleProcessOutputProcessorResult {
  /** Replacement ANSI/plain-text data for subsequent processors and rendering. */
  data?: string;
  /** Structured value to render instead of text. Use an explicit undefined to clear one. */
  structuredValue?: unknown;
  /** Link ranges for the current processor output text. */
  links?: readonly ConsoleLink[];
  /** Metadata merged over metadata accumulated by earlier processors. */
  metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Ordered plugin that can transform or enrich one CLI-output entry.
 *
 * Processors should return only the fields they want to change. Returning
 * undefined leaves the current state untouched.
 */
export interface ConsoleProcessOutputProcessor {
  /** Optional identifier useful to hosts for diagnostics and composition. */
  readonly id?: string;
  process(
    output: ConsoleProcessOutput,
    context: ConsoleProcessOutputProcessorContext,
  ): ConsoleProcessOutputProcessorResult | undefined | void;
}
