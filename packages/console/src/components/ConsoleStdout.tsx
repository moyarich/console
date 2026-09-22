import { ConsoleValue } from "./ConsoleValue";
import { ConsoleLinkedText } from "./ConsoleLinkedText";
import type { ConsoleValueRenderer } from "../types";
import type {
  ConsoleLink,
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
} from "../links/types";
import {
  normalizeConsoleProcessOutputEntries,
  processConsoleOutputEntry,
} from "../cliOutput/processOutput";
import type { ConsoleProcessOutputProcessor } from "../cliOutput/processors/types";
import type { ConsoleStdoutEntry } from "../cliOutput/types";
import { getAnsiTokenRanges } from "../utils/ansi/getAnsiTokenRanges";
import { getAnsiTokenStyle } from "../utils/ansi/getAnsiTokenStyle";
import { hasAnsiClearLine } from "../utils/ansi/hasAnsiClearLine";
import { parseStructuredOutput } from "../cliOutput/parsers/parseStructuredOutput";
import type { ConsoleStructuredOutputParser } from "../cliOutput/parsers/types";

export type {
  ConsoleOutputStream,
  ConsoleProcessOutputMetadata,
  ConsoleStdoutEntry,
} from "../cliOutput/types";
export type { ConsoleProcessOutputProcessor } from "../cliOutput/processors/types";

export type {
  ConsoleStructuredOutputParser,
  ConsoleStructuredOutputParserContext,
} from "../cliOutput/parsers/types";

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
