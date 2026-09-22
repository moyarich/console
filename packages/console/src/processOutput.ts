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

interface MutableConsoleOutputLine {
  data: string;
  id?: string;
  stream?: ConsoleOutputStream;
  metadata?: ConsoleProcessOutputMetadata;
}

const ANSI_CLEAR_LINE_PATTERN = /^\u001b\[[012]?K/;

function createOutputLine(
  source: ConsoleStdoutEntry,
  data = "",
): MutableConsoleOutputLine {
  return {
    data,
    ...(source.id !== undefined ? { id: source.id } : {}),
    ...(source.stream !== undefined ? { stream: source.stream } : {}),
    ...(source.metadata !== undefined
      ? { metadata: { ...source.metadata } }
      : {}),
  };
}

function mergeOutputLineMetadata(
  line: MutableConsoleOutputLine,
  source: ConsoleStdoutEntry,
) {
  if (line.id === undefined && source.id !== undefined) {
    line.id = source.id;
  }

  if (line.stream === undefined && source.stream !== undefined) {
    line.stream = source.stream;
  }

  if (source.metadata) {
    line.metadata = {
      ...(line.metadata ?? {}),
      ...source.metadata,
    };
  }
}

/**
 * Converts raw stdout/stderr chunks into stable logical lines.
 *
 * Newlines commit the current line. A standalone carriage return keeps the
 * current line visible until more output arrives, then the next content
 * replaces that line. CRLF is treated as a normal newline. ANSI clear-line
 * sequences clear the current logical line without introducing cursor/buffer
 * emulation.
 */
export function normalizeConsoleProcessOutputEntries(
  entries: readonly (ConsoleStdoutEntry | string)[],
): ConsoleStdoutEntry[] {
  const normalized: ConsoleStdoutEntry[] = [];
  const idCounts = new Map<string, number>();
  let current: MutableConsoleOutputLine | undefined;
  let pendingCarriageReturn = false;

  const commitCurrent = () => {
    if (!current) {
      return;
    }

    const next: ConsoleStdoutEntry = {
      data: current.data,
      ...(current.stream !== undefined ? { stream: current.stream } : {}),
      ...(current.metadata !== undefined
        ? { metadata: Object.freeze({ ...current.metadata }) }
        : {}),
    };

    if (current.id !== undefined) {
      const count = idCounts.get(current.id) ?? 0;
      next.id = count === 0 ? current.id : `${current.id}:${count}`;
      idCounts.set(current.id, count + 1);
    }

    normalized.push(next);
    current = undefined;
  };

  for (const entry of entries) {
    const source: ConsoleStdoutEntry =
      typeof entry === "string" ? { data: entry } : entry;

    if (
      current?.stream !== undefined &&
      source.stream !== undefined &&
      current.stream !== source.stream
    ) {
      commitCurrent();
      pendingCarriageReturn = false;
    } else if (current) {
      mergeOutputLineMetadata(current, source);
    }

    if (source.data.length === 0) {
      commitCurrent();
      pendingCarriageReturn = false;
      current = createOutputLine(source);
      commitCurrent();
      continue;
    }

    let offset = 0;

    while (offset < source.data.length) {
      const remaining = source.data.slice(offset);
      const clearLineMatch = remaining.match(ANSI_CLEAR_LINE_PATTERN);

      if (clearLineMatch) {
        current = createOutputLine(source, clearLineMatch[0]);
        pendingCarriageReturn = false;
        offset += clearLineMatch[0].length;
        continue;
      }

      const character = source.data[offset];

      if (pendingCarriageReturn) {
        if (character === "\n") {
          current ??= createOutputLine(source);
          commitCurrent();
          pendingCarriageReturn = false;
          offset += 1;
          continue;
        }

        current = createOutputLine(source, "\r");
        pendingCarriageReturn = false;
      }

      if (character === "\r") {
        current ??= createOutputLine(source);
        pendingCarriageReturn = true;
        offset += 1;
        continue;
      }

      if (character === "\n") {
        current ??= createOutputLine(source);
        commitCurrent();
        offset += 1;
        continue;
      }

      current ??= createOutputLine(source);
      current.data += character;
      offset += 1;
    }
  }

  commitCurrent();
  return normalized;
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
    metadata: source?.metadata
      ? freezeMetadata(source.metadata)
      : EMPTY_METADATA,
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
