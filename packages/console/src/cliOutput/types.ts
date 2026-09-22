import type { ConsoleLink } from "../links/types";

/** Process stream associated with an ANSI/CLI-output entry. */
export type ConsoleOutputStream = "stdout" | "stderr";

/** Arbitrary processor-produced metadata owned by the host or plugin. */
export type ConsoleProcessOutputMetadata = Readonly<Record<string, unknown>>;

/** One ANSI/CLI-output entry with optional identity, stream, and metadata. */
export interface ConsoleStdoutEntry {
  /** Optional stable key for the rendered entry. */
  id?: string;
  /** Raw ANSI or plain-text chunk. */
  data: string;
  /** Optional stdout/stderr classification. */
  stream?: ConsoleOutputStream;
  /** Optional descriptive metadata carried into the processor pipeline. */
  metadata?: ConsoleProcessOutputMetadata;
}

/** Immutable CLI-output state passed from one processor to the next. */
export interface ConsoleProcessOutput {
  /** Current ANSI or plain-text data after earlier processors. */
  readonly data: string;
  /** Optional structured value promoted by a processor. */
  readonly structuredValue?: unknown;
  /** Link ranges produced by processors for the current text. */
  readonly links?: readonly ConsoleLink[];
  /** Metadata accumulated from the source entry and earlier processors. */
  readonly metadata: ConsoleProcessOutputMetadata;
}
