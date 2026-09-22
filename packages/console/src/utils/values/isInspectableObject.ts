import { isElementLike } from "./isElementLike";
import { isObjectLike } from "./isObjectLike";

/**
 * Returns whether a value should use the expandable object inspector.
 *
 * DOM-like elements and built-in scalar-style objects such as Error, Date, and
 * RegExp are excluded because they have dedicated primitive rendering.
 *
 * @param value Candidate value.
 */
export function isInspectableObject(value: unknown): value is object {
  return (
    isObjectLike(value) &&
    !isElementLike(value) &&
    !(value instanceof Error) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}
