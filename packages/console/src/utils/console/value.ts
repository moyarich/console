export function isObjectLike(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isElementLike(
  value: unknown,
): value is object & { outerHTML: string } {
  if (!isObjectLike(value)) {
    return false;
  }

  const candidate = value as {
    nodeType?: unknown;
    outerHTML?: unknown;
  };

  return candidate.nodeType === 1 && typeof candidate.outerHTML === "string";
}

function isMapLike(value: object): value is Map<unknown, unknown> {
  return (
    value.constructor?.name === "Map" &&
    typeof (value as Map<unknown, unknown>).entries === "function"
  );
}

function isSetLike(value: object): value is Set<unknown> {
  return (
    value.constructor?.name === "Set" &&
    typeof (value as Set<unknown>).values === "function"
  );
}

export function isInspectableObject(value: unknown): value is object {
  return (
    isObjectLike(value) &&
    !isElementLike(value) &&
    !(value instanceof Error) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

export function typeClass(value: unknown): string {
  if (value === null) {
    return "console-null";
  }

  if (typeof value === "string") {
    return "console-string";
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return "console-number";
  }

  if (typeof value === "boolean") {
    return "console-boolean";
  }

  if (typeof value === "undefined") {
    return "console-undefined";
  }

  if (typeof value === "symbol") {
    return "console-symbol";
  }

  return "";
}

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
