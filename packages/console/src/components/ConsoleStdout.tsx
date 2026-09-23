import { ConsoleValue } from "./ConsoleValue";
import type { ConsoleValueRenderer } from "../renderers";
import {
  ConsoleLinkedText,
  type ConsoleLink,
  type ConsoleLinkProvider,
  type ConsoleLinkProviderContext,
} from "../links";
import {
  resolveConsoleProcessOutputEntries,
  type ConsoleProcessOutputProcessor,
  type ConsoleResolvedProcessOutputEntry,
  type ConsoleStdoutEntry,
} from "../processOutput";
import { getAnsiTokenRanges } from "../utils/terminal/getAnsiTokenRanges";
import { getAnsiTokenStyle } from "../utils/terminal/getAnsiTokenStyle";
import { hasAnsiClearLine } from "../utils/terminal/hasAnsiClearLine";
import { parseStructuredOutput } from "../utils/terminal/parseStructuredOutput";
import type { ConsoleStructuredOutputParser } from "../utils/terminal/types";

export type {
  ConsoleOutputStream,
  ConsoleProcessOutputMetadata,
  ConsoleProcessOutputProcessor,
  ConsoleStdoutEntry,
} from "../processOutput";

export type {
  ConsoleStructuredOutputParser,
  ConsoleStructuredOutputParserContext,
} from "../utils/terminal/types";

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
  /**
   * Pre-resolved logical process output supplied by the Console host so
   * processors are not executed again for the same render.
   */
  resolvedEntries?: readonly ConsoleResolvedProcessOutputEntry[];
  /** Ordered custom structured-output parsers. */
  structuredOutputParsers?: readonly ConsoleStructuredOutputParser[];
  /** Custom renderers used when a line becomes a structured value. */
  valueRenderers?: readonly ConsoleValueRenderer[];
  /** Whether built-in HTTP/HTTPS detection is enabled. @default true */
  detectLinks?: boolean;
  /** Ordered application-specific link providers. */
  linkProviders?: readonly ConsoleLinkProvider[];
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
  const { text, tokenRanges } = getAnsiTokenRanges(data);

  // Source ranges come from ConsoleLinkedText so this renderer stays pure when
  // React StrictMode renders the child component more than once.
  const renderText = (
    value: string,
    key: string,
    start: number,
    end: number,
  ) => {
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
  resolvedEntries,
  structuredOutputParsers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
}: ConsoleStdoutProps) {
  const resolvedOutputEntries =
    resolvedEntries ?? resolveConsoleProcessOutputEntries(entries, processors);

  if (!resolvedOutputEntries.length) {
    return <div className="console-stdout-empty">{emptyMessage}</div>;
  }

  return (
    <div className="console-stdout-list">
      {resolvedOutputEntries.map(({ entry, output: processedOutput }, index) => {
        const data = processedOutput.data;
        const stream = typeof entry === "string" ? undefined : entry.stream;
        const id = typeof entry === "string" ? undefined : entry.id;
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
        const clearLine = hasAnsiClearLine(data);
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
              data-console-message-id={id}
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
            data-console-message-id={id}
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
