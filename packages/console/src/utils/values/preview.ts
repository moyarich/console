import { isMapLike } from "./isMapLike";
import { isObjectLike } from "./isObjectLike";
import { isSetLike } from "./isSetLike";
import { objectEntries } from "./objectEntries";

/**
 * Builds the collapsed preview text shown beside an inspectable object.
 *
 * @param value Inspectable object.
 * @returns Compact preview string.
 */
export function preview(value: object): string {
  if (isMapLike(value)) {
    return `{ ${value.size} entries }`;
  }

  if (isSetLike(value)) {
    return `{ ${value.size} values }`;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, 3).map((item) => {
      if (typeof item === "string") {
        return JSON.stringify(item);
      }

      if (isObjectLike(item)) {
        return Array.isArray(item) ? "Array" : "Object";
      }

      return String(item);
    });

    return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
  }

  const entries = objectEntries(value).slice(0, 3);
  const parts = entries.map(([key, item]) => {
    if (typeof item === "string") {
      return `${key}: ${JSON.stringify(item)}`;
    }

    if (isObjectLike(item)) {
      return `${key}: ${Array.isArray(item) ? "Array" : "Object"}`;
    }

    return `${key}: ${String(item)}`;
  });

  return `{ ${parts.join(", ")}${Object.keys(value).length > 3 ? ", …" : ""} }`;
}
