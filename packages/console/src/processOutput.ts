import Anser from "anser";

/** Process stream associated with an ANSI/process-output entry. */
export type ConsoleOutputStream = "stdout" | "stderr";

/** Arbitrary processor-produced metadata owned by the host or plugin. */
export type ConsoleProcessOutputMetadata = Readonly<Record<string, unknown>>;

/** One ANSI/process-output entry with optional identity, stream, and metadata. */
export interface ConsoleStdoutEntry {
  /** Optional stable key for the rendered entry. */
  id?: string;
  /** Raw ANSI or plain-text chunk. */
  data: string;
  /** Optional stdout/stderr classification. */
  stream?: ConsoleOutputStream;
  /**
   * Optional descriptive metadata carried into the processor pipeline.
   *
   * This intentionally remains an extensible bag until dedicated link,
   * decoration, and runtime-status contracts are available.
   */
  metadata?: ConsoleProcessOutputMetadata;
}

/** Immutable process-output state passed from one processor to the next. */
export interface ConsoleProcessOutput {
  /** Current ANSI or plain-text data after earlier processors. */
  readonly data: string;
  /** Optional structured value promoted by a processor. */
  readonly structuredValue?: unknown;
  /** Metadata accumulated from the source entry and earlier processors. */
  readonly metadata: ConsoleProcessOutputMetadata;
}

/** Context supplied to each process-output processor. */
export interface ConsoleProcessOutputProcessorContext {
  /** Original entry before any processor transforms. */
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

/** Patch returned by a process-output processor. */
export interface ConsoleProcessOutputProcessorResult {
  /** Replacement ANSI/plain-text data for subsequent processors and rendering. */
  data?: string;
  /** Structured value to render instead of text. Use an explicit undefined to clear one. */
  structuredValue?: unknown;
  /** Metadata merged over metadata accumulated by earlier processors. */
  metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Ordered plugin that can transform or enrich one process-output entry.
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

const EMPTY_METADATA: ConsoleProcessOutputMetadata = Object.freeze({});

function freezeMetadata(
  metadata: Readonly<Record<string, unknown>>,
): ConsoleProcessOutputMetadata {
  return Object.freeze({ ...metadata });
}

function hasStructuredValue(
  result: ConsoleProcessOutputProcessorResult,
): boolean {
  return Object.prototype.hasOwnProperty.call(result, "structuredValue");
}

/**
 * Applies process-output processors in declaration order.
 *
 * Each processor receives the result of the previous processor. A processor
 * failure is isolated: its partial work is discarded and remaining processors
 * continue from the last successful state.
 */
export function processConsoleOutputEntry(
  entry: ConsoleStdoutEntry | string,
  index: number,
  processors: readonly ConsoleProcessOutputProcessor[] = [],
): ConsoleProcessOutput {
  const source = typeof entry === "string" ? undefined : entry;
  let output: ConsoleProcessOutput = Object.freeze({
    data: typeof entry === "string" ? entry : entry.data,
    metadata: source?.metadata ? freezeMetadata(source.metadata) : EMPTY_METADATA,
  });

  for (const processor of processors) {
    const context: ConsoleProcessOutputProcessorContext = Object.freeze({
      entry,
      index,
      text: Anser.ansiToText(output.data),
      id: source?.id,
      stream: source?.stream,
    });

    try {
      const result = processor.process(output, context);

      if (!result) {
        continue;
      }

      output = Object.freeze({
        data: result.data ?? output.data,
        ...(hasStructuredValue(result)
          ? { structuredValue: result.structuredValue }
          : output.structuredValue !== undefined
            ? { structuredValue: output.structuredValue }
            : {}),
        metadata: freezeMetadata({
          ...output.metadata,
          ...(result.metadata ?? {}),
        }),
      });
    } catch {
      // A plugin must not corrupt prior output or prevent later processors.
    }
  }

  return output;
}
