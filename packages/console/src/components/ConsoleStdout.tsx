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
  type ConsoleProcessControlParser,
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
  ConsoleProcessControlEvent,
  ConsoleProcessControlOutput,
  ConsoleProcessControlParser,
  ConsoleProcessControlParserContext,
  ConsoleProcessControlParserResult,
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
  /** Ordered raw control parsers applied before line normalization. */
  processControlParsers?: readonly ConsoleProcessControlParser[];
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

interface ConsoleResolvedStdoutProps extends Omit<
  ConsoleStdoutProps,
  "entries" | "processControlParsers" | "processors"
> {
  resolvedEntries: readonly ConsoleResolvedProcessOutputEntry[];
}

function AnsiText({
  data,
  context,
  detectLinks,
  linkProviders,
  links,
}: {
  data: string;
  context: Omit<ConsoleLinkProviderContext, "text">;
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
 * Renders an already-resolved process view without running processors again.
 * This is internal to the core React host and is not exported from the package
 * entry point.
 */
export function ConsoleResolvedStdout({
  resolvedEntries,
  emptyMessage = "No stdout output yet.",
  parseStructuredOutput: shouldParseStructuredOutput = false,
  structuredOutputParsers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
}: ConsoleResolvedStdoutProps) {
  if (!resolvedEntries.length) {
    return <div className="console-stdout-empty">{emptyMessage}</div>;
  }

  return (
    <div className="console-stdout-list">
      {resolvedEntries.map(({ entry, output: processedOutput }, index) => {
        const data = processedOutput.data;
        const stream = entry.stream;
        const id = entry.id;
        const key = entry.id ?? `stdout-${index}`;
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
        const linkContext: Omit<ConsoleLinkProviderContext, "text"> = {
          mode: "terminal",
          index,
          ...(entry.id !== undefined ? { id: entry.id } : {}),
          ...(entry.stream !== undefined ? { stream: entry.stream } : {}),
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

/**
 * Renders ANSI-aware process output and optionally promotes matching lines to
 * structured values rendered by {@link ConsoleValue}.
 */
export function ConsoleStdout({
  entries,
  processControlParsers,
  processors,
  ...props
}: ConsoleStdoutProps) {
  return (
    <ConsoleResolvedStdout
      {...props}
      resolvedEntries={resolveConsoleProcessOutputEntries(
        entries,
        processors,
        processControlParsers,
      )}
    />
  );
}
