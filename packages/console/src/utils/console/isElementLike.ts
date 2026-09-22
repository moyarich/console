import { isObjectLike } from "./isObjectLike";

/**
 * Detects DOM-element-like values without requiring a browser Element instance.
 *
 * This supports serialized or cross-realm element values by checking nodeType
 * and outerHTML rather than relying on instanceof.
 *
 * @param value Candidate value.
 */
export function isElementLike(
  value: unknown,
): value is object & { outerHTML: string; tagName?: string } {
  if (!isObjectLike(value)) {
    return false;
  }

  const candidate = value as {
    nodeType?: unknown;
    outerHTML?: unknown;
  };

  return candidate.nodeType === 1 && typeof candidate.outerHTML === "string";
}
