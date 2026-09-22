import type { ConsoleLink } from "./types";
import { isSafeWebUrl } from "./isSafeWebUrl";

const WEB_URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?]+$/;

function trimWebUrlCandidate(candidate: string): string {
  let trimmed = candidate.replace(TRAILING_PUNCTUATION_PATTERN, "");

  const pairs: Array<[string, string]> = [
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
  ];

  for (const [opening, closing] of pairs) {
    while (trimmed.endsWith(closing)) {
      const openingCount = trimmed.split(opening).length - 1;
      const closingCount = trimmed.split(closing).length - 1;

      if (closingCount <= openingCount) {
        break;
      }

      trimmed = trimmed.slice(0, -1);
    }
  }

  return trimmed;
}

/** Detects safe HTTP/HTTPS links with source text ranges. */
export function detectWebLinks(text: string): ConsoleLink[] {
  const links: ConsoleLink[] = [];

  for (const match of text.matchAll(WEB_URL_PATTERN)) {
    const raw = match[0];
    const start = match.index;

    if (start === undefined) {
      continue;
    }

    const value = trimWebUrlCandidate(raw);

    if (!value || !isSafeWebUrl(value)) {
      continue;
    }

    links.push({
      text: value,
      start,
      end: start + value.length,
      target: value,
    });
  }

  return links;
}
