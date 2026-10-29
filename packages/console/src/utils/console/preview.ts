import { isMapLike } from "./isMapLike";
import { isObjectLike } from "./isObjectLike";
import { isSetLike } from "./isSetLike";

const PREVIEW_ITEMS = 3;

function previewValue(value: unknown): string {
  if (typeof value === "string") {
    // Long strings remain available in full in the expanded inspector.
    return value.length > 80
      ? `String(${value.length})`
      : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (isObjectLike(value)) {
    if (isMapLike(value)) return `Map(${value.size})`;
    if (isSetLike(value)) return `Set(${value.size})`;
    return "Object";
  }
  if (typeof value === "function") return "ƒ";
  return String(value);
}

/** Shallow, bounded summary. Previewing never evaluates property getters. */
export function preview(value: object): string {
  if (isMapLike(value)) return `{ ${value.size} entries }`;
  if (isSetLike(value)) return `{ ${value.size} values }`;

  const keys = Object.keys(value);
  const parts = keys.slice(0, PREVIEW_ITEMS).map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    const item =
      descriptor && "value" in descriptor
        ? previewValue(descriptor.value)
        : descriptor?.get
          ? "[Getter]"
          : "[Setter]";
    return Array.isArray(value) ? item : `${key}: ${item}`;
  });
  const remaining = keys.length - parts.length;
  if (remaining) parts.push(`+${remaining} more`);
  return Array.isArray(value)
    ? `[${parts.join(", ")}]`
    : `{ ${parts.join(", ")} }`;
}
