import { isMapLike } from "./isMapLike";
import { isSetLike } from "./isSetLike";

/**
 * Converts supported inspectable objects into property entries for rendering.
 *
 * Maps and Sets receive numeric display keys, and ArrayBuffers are exposed as
 * byte values.
 *
 * @param value Inspectable object.
 * @returns Display entries for the object inspector.
 */
export function objectEntries(value: object): [string, unknown][] {
  if (isMapLike(value)) {
    return Array.from(value.entries()).map((entry, index) => [
      String(index),
      entry,
    ]);
  }

  if (isSetLike(value)) {
    return Array.from(value.values()).map((item, index) => [
      String(index),
      item,
    ]);
  }

  if (value instanceof ArrayBuffer) {
    return Array.from(new Uint8Array(value)).map((item, index) => [
      String(index),
      item,
    ]);
  }

  return Object.entries(value);
}
