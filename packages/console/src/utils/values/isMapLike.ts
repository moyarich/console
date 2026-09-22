/**
 * Detects Map-like objects, including compatible cross-realm values.
 *
 * @param value Candidate object.
 */
export function isMapLike(value: object): value is Map<unknown, unknown> {
  return (
    value.constructor?.name === "Map" &&
    typeof (value as Map<unknown, unknown>).entries === "function"
  );
}
