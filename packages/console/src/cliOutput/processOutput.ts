import Anser from "anser";
import { ANSI_CLEAR_LINE_PREFIX_PATTERN } from "../utils/ansi/constants";
import type {
  ConsoleProcessOutputProcessor,
  ConsoleProcessOutputProcessorContext,
  ConsoleProcessOutputProcessorResult,
} from "./processors/types";
import type {
  ConsoleOutputStream,
  ConsoleProcessOutput,
  ConsoleProcessOutputMetadata,
  ConsoleStdoutEntry,
} from "./types";

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
    const startsWithLineControl =
      source.data.charCodeAt(0) === 13 ||
      source.data.charCodeAt(0) === 10 ||
      ANSI_CLEAR_LINE_PREFIX_PATTERN.test(source.data);
    const streamChanged =
      current?.stream !== undefined &&
      source.stream !== undefined &&
      current.stream !== source.stream;

    if (
      current &&
      (streamChanged || (!pendingCarriageReturn && !startsWithLineControl))
    ) {
      commitCurrent();
      pendingCarriageReturn = false;
    }

    if (current) {
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
      const clearLineMatch = remaining.match(ANSI_CLEAR_LINE_PREFIX_PATTERN);

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

        const clearLinePrefix =
          current && ANSI_CLEAR_LINE_PREFIX_PATTERN.test(current.data)
            ? current.data
            : "";
        current = createOutputLine(source, clearLinePrefix);
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
 * Link ranges produced before a later text transform are discarded because
 * their offsets no longer describe the transformed output. A processor that
 * changes data can return replacement links for the new text in the same patch.
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

      const data = result.data ?? output.data;
      const dataChanged =
        result.data !== undefined && result.data !== output.data;
      const links = result.links
        ? dataChanged
          ? result.links
          : [...(output.links ?? []), ...result.links]
        : dataChanged
          ? undefined
          : output.links;

      output = Object.freeze({
        data,
        ...(hasStructuredValue(result)
          ? { structuredValue: result.structuredValue }
          : output.structuredValue !== undefined
            ? { structuredValue: output.structuredValue }
            : {}),
        ...(links?.length ? { links: Object.freeze([...links]) } : {}),
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
