/**
 * Returns whether a value is a non-null object.
 *
 * @param value Candidate value.
 */
export function isObjectLike(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}
