import { isMapLike } from "./isMapLike";
import { isSetLike } from "./isSetLike";

/**
 * Builds the compact type label shown by the console object inspector.
 *
 * @param value Inspectable object.
 * @returns Human-readable object type label.
 */
export function objectLabel(value: object): string {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  if (isMapLike(value)) {
    return `Map(${value.size})`;
  }

  if (isSetLike(value)) {
    return `Set(${value.size})`;
  }

  if (value instanceof ArrayBuffer) {
    return `ArrayBuffer(${value.byteLength})`;
  }

  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const length = (value as unknown as { length?: number }).length;
    return `${value.constructor.name}(${length ?? value.byteLength})`;
  }

  const constructorName = value.constructor?.name;
  return constructorName && constructorName !== "Object"
    ? constructorName
    : "Object";
}
