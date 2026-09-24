import { parseCssColor } from "./parseCssColor";
import type { CssColorMatch } from "./types";

const COLOR_CANDIDATE_PATTERN =
  /#[\da-fA-F]{3,8}(?![\da-fA-F])|(?:rgba?|hsla?)\([^)]*\)|\b[a-zA-Z]+\b/g;

function isIdentifierCharacter(value: string | undefined) {
  return value !== undefined && /[\w-]/.test(value);
}

/**
 * Extracts supported CSS color literals from arbitrary source text.
 *
 * Matches include absolute UTF-16 offsets so consumers can map colors back to
 * editor ranges without depending on an editor-specific API.
 */
export function extractCssColors(source: string): CssColorMatch[] {
  const matches: CssColorMatch[] = [];

  for (const candidate of source.matchAll(COLOR_CANDIDATE_PATTERN)) {
    const value = candidate[0];
    const start = candidate.index;

    if (start === undefined) {
      continue;
    }

    const isWord = /^[a-zA-Z]+$/.test(value);

    if (
      isWord &&
      (isIdentifierCharacter(source[start - 1]) ||
        isIdentifierCharacter(source[start + value.length]))
    ) {
      continue;
    }

    const parsed = parseCssColor(value);

    if (!parsed) {
      continue;
    }

    matches.push({
      value,
      start,
      end: start + value.length,
      format: parsed.format,
      color: parsed.color,
    });
  }

  return matches;
}
