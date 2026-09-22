/**
 * Detects Set-like objects, including compatible cross-realm values.
 *
 * @param value Candidate object.
 */
export function isSetLike(value: object): value is Set<unknown> {
  return (
    value.constructor?.name === "Set" &&
    typeof (value as Set<unknown>).values === "function"
  );
}
