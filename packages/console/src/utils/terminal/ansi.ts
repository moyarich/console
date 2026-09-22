import Anser from "anser";
import type { CSSProperties } from "react";

export type AnserToken = ReturnType<typeof Anser.ansiToJson>[number];

export interface AnsiTokenRange {
  token: AnserToken;
  start: number;
  end: number;
}

const ANSI_ESCAPE = String.fromCharCode(27);
const ANSI_CLEAR_LINE_PATTERN = new RegExp(`${ANSI_ESCAPE}\\[[012]?K`);

/** Converts an Anser token into React inline styles. */
export function getAnsiTokenStyle(token: AnserToken): CSSProperties {
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

/** Returns ANSI-stripped text with token ranges measured against that text. */
export function getAnsiTokenRanges(data: string): {
  text: string;
  tokenRanges: AnsiTokenRange[];
} {
  const tokens = Anser.ansiToJson(data, { remove_empty: true });
  let offset = 0;

  const tokenRanges = tokens.map((token) => {
    const start = offset;
    offset += token.content.length;

    return { token, start, end: offset };
  });

  return {
    text: tokenRanges.map(({ token }) => token.content).join(""),
    tokenRanges,
  };
}

/** Returns whether process output contains a clear-line control. */
export function hasAnsiClearLine(data: string): boolean {
  return (
    ANSI_CLEAR_LINE_PATTERN.test(data) ||
    Anser.ansiToJson(data).some((token) => token.clearLine)
  );
}

/** Removes ANSI control sequences while preserving visible text. */
export function stripAnsiText(data: string): string {
  return Anser.ansiToText(data);
}
