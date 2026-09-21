import Anser from "anser";
import type { CSSProperties } from "react";
import { ConsoleValue } from "./ConsoleValue";
import type { ConsoleValueRenderer } from "../renderers";

/** Process stream associated with an ANSI output entry. */
export type ConsoleOutputStream = "stdout" | "stderr";

/** One ANSI/process-output entry with optional identity and stream metadata. */
export interface ConsoleStdoutEntry {
  /** Optional stable key for the rendered entry. */
  id?: string;
  /** Raw ANSI or plain-text chunk. */
  data: string;
  /** Optional stdout/stderr classification. */
  stream?: ConsoleOutputStream;
}

/** Metadata supplied to structured-output parsers. */
export interface ConsoleStructuredOutputParserContext {
  /** Original entry before ANSI codes are stripped for parser input. */
  entry: ConsoleStdoutEntry | string;
  /** Zero-based entry index. */
  index: number;
  /** Stable entry id when one was supplied. */
  id?: string;
  /** stdout/stderr metadata when one was supplied. */
  stream?: ConsoleOutputStream;
}

/**
 * Parses a plain-text ANSI line into a structured value.
 *
 * Return `undefined` to leave the line as ANSI text or allow another parser
 * to handle it.
 */
export type ConsoleStructuredOutputParser = (
  text: string,
  context: ConsoleStructuredOutputParserContext,
) => unknown | undefined;

/** Props for rendering ANSI-aware stdout/stderr entries. */
export interface ConsoleStdoutProps {
  /** Ordered process-output entries. */
  entries: readonly (ConsoleStdoutEntry | string)[];
  /** Empty-state text. */
  emptyMessage?: string;
  /** Whether complete JSON object/array lines should render as structured values. */
  parseStructuredOutput?: boolean;
  /** Ordered custom structured-output parsers. */
  structuredOutputParsers?: readonly ConsoleStructuredOutputParser[];
  /** Custom renderers used when a line becomes a structured value. */
  valueRenderers?: readonly ConsoleValueRenderer[];
}

type AnserToken = ReturnType<typeof Anser.ansiToJson>[number];

/** Converts an Anser token into React inline styles. */
function getAnsiTokenStyle(token: AnserToken): CSSProperties {
  const decorations = token.decorations ?? [];
  const textDecoration: string[] = [];
  const style: CSSProperties = {};

  if (token.fg) {
    style.color = `rgb(${token.fg})`;
  }

  if (token.bg) {
    style.backgroundColor = `rgb(${token.bg})`;
  }

  if (decorations.includes("bold")) {
    style.fontWeight = "bold";
  }

  if (decorations.includes("dim")) {
    style.opacity = 0.5;
  }

  if (decorations.includes("italic")) {
    style.fontStyle = "italic";
  }

  if (decorations.includes("hidden")) {
    style.visibility = "hidden";
  }

  if (decorations.includes("underline")) {
    textDecoration.push("underline");
  }

  if (decorations.includes("strikethrough")) {
    textDecoration.push("line-through");
  }

  if (decorations.includes("blink")) {
    textDecoration.push("blink");
  }

  if (textDecoration.length) {
    style.textDecoration = textDecoration.join(" ");
  }

  return style;
}

/** Parses only complete JSON object/array text, never scalar JSON values. */
function parseStrictJsonOutput(text: string): object | undefined {
  const trimmedText = text.trim();

  if (
    !trimmedText ||
    (!trimmedText.startsWith("{") && !trimmedText.startsWith("["))
  ) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(trimmedText);

    return typeof value === "object" && value !== null ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Runs custom structured parsers before the optional strict JSON parser. */
function parseStructuredOutput(
  data: string,
  entry: ConsoleStdoutEntry | string,
  index: number,
  shouldParseStrictJson: boolean,
  parsers: readonly ConsoleStructuredOutputParser[] | undefined,
): unknown | undefined {
  const text = Anser.ansiToText(data);
  const metadata =
    typeof entry === "string"
      ? { entry, index }
      : { entry, index, id: entry.id, stream: entry.stream };

  for (const parser of parsers ?? []) {
    try {
      const value = parser(text, metadata);

      if (value !== undefined) {
        return value;
      }
    } catch {
      // A custom parser must not prevent the original output from rendering.
    }
  }

  return shouldParseStrictJson ? parseStrictJsonOutput(text) : undefined;
}

function AnsiText({ data }: { data: string }) {
  const tokens = Anser.ansiToJson(data, { remove_empty: true });

  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} style={getAnsiTokenStyle(token)}>
          {token.content}
        </span>
      ))}
    </>
  );
}

/**
 * Renders ANSI-aware process output and optionally promotes matching lines to
 * structured values rendered by {@link ConsoleValue}.
 */
export function ConsoleStdout({
  entries,
  emptyMessage = "No stdout output yet.",
  parseStructuredOutput: shouldParseStructuredOutput = false,
  structuredOutputParsers,
  valueRenderers,
}: ConsoleStdoutProps) {
  if (!entries.length) {
    return <div className="console-stdout-empty">{emptyMessage}</div>;
  }

  return (
    <div className="console-stdout-list">
      {entries.map((entry, index) => {
        const data = typeof entry === "string" ? entry : entry.data;
        const stream = typeof entry === "string" ? undefined : entry.stream;
        const key =
          typeof entry === "string"
            ? `stdout-${index}`
            : (entry.id ?? `stdout-${index}`);
        const structuredValue =
          shouldParseStructuredOutput || structuredOutputParsers?.length
            ? parseStructuredOutput(
                data,
                entry,
                index,
                shouldParseStructuredOutput,
                structuredOutputParsers,
              )
            : undefined;
        const clearLine = Anser.ansiToJson(data).some(
          (token) => token.clearLine,
        );

        if (structuredValue !== undefined) {
          return (
            <div
              className="console-stdout-line console-stdout-structured"
              data-stream={stream}
              data-clear-line={clearLine || undefined}
              key={key}
            >
              <ConsoleValue
                value={structuredValue}
                renderers={valueRenderers}
              />
            </div>
          );
        }

        return (
          <pre
            className="console-stdout-line"
            data-stream={stream}
            data-clear-line={clearLine || undefined}
            key={key}
          >
            <AnsiText data={data} />
          </pre>
        );
      })}
    </div>
  );
}
