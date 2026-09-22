import Anser from "anser";
import type { AnsiTokenRange } from "./types";

/**
 * Parses ANSI process output and maps each token to offsets in visible text.
 *
 * @param data ANSI-encoded process-output text.
 * @returns ANSI-stripped text plus token ranges measured against that text.
 */
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
