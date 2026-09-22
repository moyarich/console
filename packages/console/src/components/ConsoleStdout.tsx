import Anser from "anser";
import type { CSSProperties } from "react";
import { ConsoleValue } from "./ConsoleValue";
import type { ConsoleValueRenderer } from "../renderers";
import {
  ConsoleLinkedText,
  type ConsoleLink,
  type ConsoleLinkProvider,
  type ConsoleLinkProviderContext,
} from "../links";
import {
  normalizeConsoleProcessOutputEntries,
  processConsoleOutputEntry,
  type ConsoleOutputStream,
  type ConsoleProcessOutputMetadata,
  type ConsoleProcessOutputProcessor,
  type ConsoleStdoutEntry,
} from "../processOutput";

export type {
  ConsoleOutputStream,
  ConsoleProcessOutputMetadata,
  ConsoleProcessOutputProcessor,
  ConsoleStdoutEntry,
} from "../processOutput";

/** Metadata supplied to structured-output parsers. */
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
  /** Ordered process-output processors applied before structured parsing. */
  processors?: readonly ConsoleProcessOutputProcessor[];
  /** Ordered custom structured-output parsers. */
  structuredOutputParsers?: readonly ConsoleStructuredOutputParser[];
  /** Custom renderers used when a line becomes a structured value. */
  valueRenderers?: readonly ConsoleValueRenderer[];
  /** Whether built-in HTTP/HTTPS detection is enabled. @default true */
  detectLinks?: boolean;
  /** Ordered application-specific link providers. */
  linkProviders?: readonly ConsoleLinkProvider[];
}

type AnserToken = ReturnType<typeof Anser.ansiToJson>[number];

const ANSI_ESCAPE = String.fromCharCode(27);
const ANSI_CLEAR_LINE_PATTERN = new RegExp(`${ANSI_ESCAPE}\\[[012]?K`);

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
  processMetadata: ConsoleProcessOutputMetadata,
): unknown | undefined {
  const text = Anser.ansiToText(data);
  const context =
    typeof entry === "string"
      ? { entry, index, metadata: processMetadata }
      : {
          entry,
          index,
          id: entry.id,
          stream: entry.stream,
          metadata: processMetadata,
        };

  for (const parser of parsers ?? []) {
    try {
      const value = parser(text, context);

      if (value !== undefined) {
        return value;
      }
    } catch {
      // A custom parser must not prevent the original output from rendering.
    }
  }

  return shouldParseStrictJson ? parseStrictJsonOutput(text) : undefined;
}

function AnsiText({
  data,
  context,
  detectLinks,
  linkProviders,
  links,
}: {
  data: string;
  context: ConsoleLinkProviderContext;
  detectLinks: boolean;
  linkProviders?: readonly ConsoleLinkProvider[];
  links?: readonly ConsoleLink[];
}) {
  const tokens = Anser.ansiToJson(data, { remove_empty: true });
  let tokenOffset = 0;
  const tokenRanges = tokens.map((token) => {
    const start = tokenOffset;
    tokenOffset += token.content.length;

    return { token, start, end: tokenOffset };
  });
  const text = tokenRanges.map(({ token }) => token.content).join("");
  let renderOffset = 0;

  const renderText = (value: string, key: string) => {
    const start = renderOffset;
    const end = start + value.length;
    renderOffset = end;

    return (
      <>
        {tokenRanges.map(
          ({ token, start: tokenStart, end: tokenEnd }, index) => {
            const overlapStart = Math.max(start, tokenStart);
            const overlapEnd = Math.min(end, tokenEnd);

            if (overlapStart >= overlapEnd) {
              return null;
            }

            return (
              <span key={`${key}-${index}`} style={getAnsiTokenStyle(token)}>
                {token.content.slice(
                  overlapStart - tokenStart,
                  overlapEnd - tokenStart,
                )}
              </span>
            );
          },
        )}
      </>
    );
  };

  return (
    <ConsoleLinkedText
      text={text}
      context={context}
      detectLinks={detectLinks}
      providers={linkProviders}
      links={links}
      renderText={renderText}
    />
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
  processors,
  structuredOutputParsers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
}: ConsoleStdoutProps) {
  const normalizedEntries = normalizeConsoleProcessOutputEntries(entries);

  if (!normalizedEntries.length) {
    return <div className="console-stdout-empty">{emptyMessage}</div>;
  }

  return (
    <div className="console-stdout-list">
      {normalizedEntries.map((entry, index) => {
        const processedOutput = processConsoleOutputEntry(
          entry,
          index,
          processors,
        );
        const data = processedOutput.data;
        const stream = typeof entry === "string" ? undefined : entry.stream;
        const key =
          typeof entry === "string"
            ? `stdout-${index}`
            : (entry.id ?? `stdout-${index}`);
        const structuredValue =
          processedOutput.structuredValue !== undefined
            ? processedOutput.structuredValue
            : shouldParseStructuredOutput || structuredOutputParsers?.length
              ? parseStructuredOutput(
                  data,
                  entry,
                  index,
                  shouldParseStructuredOutput,
                  structuredOutputParsers,
                  processedOutput.metadata,
                )
              : undefined;
        const clearLine =
          ANSI_CLEAR_LINE_PATTERN.test(data) ||
          Anser.ansiToJson(data).some((token) => token.clearLine);
        const linkContext: ConsoleLinkProviderContext =
          typeof entry === "string"
            ? {
                mode: "ansi",
                index,
                metadata: processedOutput.metadata,
              }
            : {
                mode: "ansi",
                index,
                id: entry.id,
                stream: entry.stream,
                metadata: processedOutput.metadata,
              };

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
                detectLinks={detectLinks}
                linkProviders={linkProviders}
                linkContext={linkContext}
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
            <AnsiText
              data={data}
              context={linkContext}
              detectLinks={detectLinks}
              linkProviders={linkProviders}
              links={processedOutput.links}
            />
          </pre>
        );
      })}
    </div>
  );
}
