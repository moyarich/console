import Anser from "anser";
import type { CSSProperties } from "react";
import { ConsoleValue } from "./ConsoleValue";
import type { ConsoleValueRenderer } from "../renderers";

export type ConsoleOutputStream = "stdout" | "stderr";

export interface ConsoleStdoutEntry {
  id?: string;
  data: string;
  stream?: ConsoleOutputStream;
}

export interface ConsoleStructuredOutputParserContext {
  entry: ConsoleStdoutEntry | string;
  index: number;
  id?: string;
  stream?: ConsoleOutputStream;
}

export type ConsoleStructuredOutputParser = (
  text: string,
  context: ConsoleStructuredOutputParserContext,
) => unknown | undefined;

export interface ConsoleStdoutProps {
  entries: readonly (ConsoleStdoutEntry | string)[];
  emptyMessage?: string;
  parseStructuredOutput?: boolean;
  structuredOutputParsers?: readonly ConsoleStructuredOutputParser[];
  valueRenderers?: readonly ConsoleValueRenderer[];
}

type AnserToken = ReturnType<typeof Anser.ansiToJson>[number];

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

        if (structuredValue) {
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
