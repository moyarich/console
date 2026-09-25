import { CSS_COLOR_FUNCTION_FORMATS } from "./colorFunctions";
import { parseCssColor } from "./parseCssColor";
import type { CssColorMatch } from "./types";

function isIdentifierCharacter(value: string | undefined) {
  return value !== undefined && /[\w-]/.test(value);
}

// Walk nested functions as one range, including multiline mixes and calc().
// Recover at the next declaration when an expression is still being typed.
function functionEnd(source: string, open: number) {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === ";" || character === "}") {
      return index;
    }
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }
  return source.length;
}

/**
 * Extracts supported CSS colors from arbitrary source text.
 *
 * Matches include absolute UTF-16 offsets. A resolved color function is one
 * match covering the complete expression, without overlapping argument colors.
 */
export function extractCssColors(source: string): CssColorMatch[] {
  const matches: CssColorMatch[] = [];
  const candidates = /#[\w-]+|[a-zA-Z_][\w-]*/g;

  for (
    let candidate = candidates.exec(source);
    candidate;
    candidate = candidates.exec(source)
  ) {
    let value = candidate[0];
    const start = candidate.index;
    if (isIdentifierCharacter(source[start - 1])) {
      continue;
    }

    if (source[candidates.lastIndex] === "(") {
      if (!CSS_COLOR_FUNCTION_FORMATS.has(value.toLowerCase())) {
        // A function name such as tan() is not the named color "tan".
        continue;
      }
      const end = functionEnd(source, candidates.lastIndex);
      value = source.slice(start, end);
      // Also consume unresolved expressions: decorating an argument as if it
      // were the result would be misleading, and creates overlapping edits.
      candidates.lastIndex = end;
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
