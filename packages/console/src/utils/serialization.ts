import type { ConsoleEvent, ConsoleMessageData } from "../types";

export interface SerializeConsoleValueOptions {
  maxDepth?: number;
  maxEntries?: number;
}

const SERIALIZED_TYPE = "__moyarichConsoleType" as const;

type SerializedConsoleType =
  | "undefined"
  | "bigint"
  | "symbol"
  | "function"
  | "nan"
  | "infinity"
  | "negative-infinity"
  | "negative-zero"
  | "error"
  | "date"
  | "regexp"
  | "map"
  | "set"
  | "array-buffer"
  | "typed-array"
  | "data-view"
  | "html-element"
  | "node-list";

type TaggedConsoleValue = Record<string, unknown> & {
  [SERIALIZED_TYPE]: SerializedConsoleType;
};

function isElementLike(
  value: object,
): value is object & { outerHTML: string; tagName?: string } {
  const candidate = value as {
    nodeType?: unknown;
    outerHTML?: unknown;
  };

  return candidate.nodeType === 1 && typeof candidate.outerHTML === "string";
}

function isNodeListLike(value: object): value is object & ArrayLike<unknown> {
  return (
    value.constructor?.name === "NodeList" &&
    typeof (value as { length?: unknown }).length === "number"
  );
}

function normalizeValue(
  value: unknown,
  seen: WeakSet<object>,
  depth: number,
  maxDepth: number,
  maxEntries: number,
): unknown {
  if (typeof value === "undefined") {
    return { [SERIALIZED_TYPE]: "undefined" };
  }

  if (typeof value === "bigint") {
    return {
      [SERIALIZED_TYPE]: "bigint",
      value: value.toString(),
    };
  }

  if (typeof value === "symbol") {
    return {
      [SERIALIZED_TYPE]: "symbol",
      description: value.description,
    };
  }

  if (typeof value === "function") {
    return {
      [SERIALIZED_TYPE]: "function",
      name: value.name || "anonymous",
    };
  }

  if (typeof value === "number") {
    if (Number.isNaN(value)) return { [SERIALIZED_TYPE]: "nan" };
    if (value === Infinity) return { [SERIALIZED_TYPE]: "infinity" };
    if (value === -Infinity) return { [SERIALIZED_TYPE]: "negative-infinity" };
    if (Object.is(value, -0)) return { [SERIALIZED_TYPE]: "negative-zero" };
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) return "[Circular]";
  if (depth >= maxDepth) return `[${value.constructor?.name || "Object"}]`;

  seen.add(value);

  try {
    if (value instanceof Error) {
      return {
        [SERIALIZED_TYPE]: "error",
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (value instanceof Date) {
      return {
        [SERIALIZED_TYPE]: "date",
        value: Number.isNaN(value.getTime()) ? null : value.toISOString(),
      };
    }

    if (value instanceof RegExp) {
      return {
        [SERIALIZED_TYPE]: "regexp",
        source: value.source,
        flags: value.flags,
      };
    }

    if (value instanceof Map) {
      return {
        [SERIALIZED_TYPE]: "map",
        entries: Array.from(value.entries())
          .slice(0, maxEntries)
          .map(([key, item]) => [
            normalizeValue(key, seen, depth + 1, maxDepth, maxEntries),
            normalizeValue(item, seen, depth + 1, maxDepth, maxEntries),
          ]),
      };
    }

    if (value instanceof Set) {
      return {
        [SERIALIZED_TYPE]: "set",
        values: Array.from(value.values())
          .slice(0, maxEntries)
          .map((item) =>
            normalizeValue(item, seen, depth + 1, maxDepth, maxEntries),
          ),
      };
    }

    if (value instanceof ArrayBuffer) {
      return {
        [SERIALIZED_TYPE]: "array-buffer",
        bytes: Array.from(new Uint8Array(value)).slice(0, maxEntries),
      };
    }

    if (ArrayBuffer.isView(value)) {
      const bytes = Array.from(
        new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
      ).slice(0, maxEntries);

      if (value instanceof DataView) {
        return {
          [SERIALIZED_TYPE]: "data-view",
          bytes,
        };
      }

      return {
        [SERIALIZED_TYPE]: "typed-array",
        name: value.constructor.name,
        values: Array.from(value as unknown as ArrayLike<unknown>)
          .slice(0, maxEntries)
          .map((item) =>
            normalizeValue(item, seen, depth + 1, maxDepth, maxEntries),
          ),
      };
    }

    if (isElementLike(value)) {
      return {
        [SERIALIZED_TYPE]: "html-element",
        tagName: value.tagName,
        outerHTML: value.outerHTML,
      };
    }

    if (isNodeListLike(value)) {
      return {
        [SERIALIZED_TYPE]: "node-list",
        values: Array.from(value)
          .slice(0, maxEntries)
          .map((item) =>
            normalizeValue(item, seen, depth + 1, maxDepth, maxEntries),
          ),
      };
    }

    if (Array.isArray(value)) {
      const items: unknown[] = value
        .slice(0, maxEntries)
        .map((item) =>
          normalizeValue(item, seen, depth + 1, maxDepth, maxEntries),
        );

      if (value.length > maxEntries) {
        items.push(`[+${value.length - maxEntries} more]`);
      }

      return items;
    }

    const entries = Object.entries(value).slice(0, maxEntries);
    const result: Record<string, unknown> = Object.fromEntries(
      entries.map(([key, item]) => [
        key,
        normalizeValue(item, seen, depth + 1, maxDepth, maxEntries),
      ]),
    );
    const total = Object.keys(value).length;

    if (total > maxEntries) {
      result["…"] = `[+${total - maxEntries} more]`;
    }

    return result;
  } catch {
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  } finally {
    seen.delete(value);
  }
}

function isTaggedConsoleValue(value: unknown): value is TaggedConsoleValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const type = (value as Record<string, unknown>)[SERIALIZED_TYPE];

  return (
    typeof type === "string" &&
    [
      "undefined",
      "bigint",
      "symbol",
      "function",
      "nan",
      "infinity",
      "negative-infinity",
      "negative-zero",
      "error",
      "date",
      "regexp",
      "map",
      "set",
      "array-buffer",
      "typed-array",
      "data-view",
      "html-element",
      "node-list",
    ].includes(type)
  );
}

export function serializeConsoleValue(
  value: unknown,
  { maxDepth = 8, maxEntries = 100 }: SerializeConsoleValueOptions = {},
): unknown {
  return normalizeValue(value, new WeakSet<object>(), 0, maxDepth, maxEntries);
}

export function deserializeConsoleValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeConsoleValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (!isTaggedConsoleValue(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        deserializeConsoleValue(item),
      ]),
    );
  }

  const type = value[SERIALIZED_TYPE];

  switch (type) {
    case "undefined":
      return undefined;

    case "bigint":
      return typeof value.value === "string"
        ? BigInt(value.value)
        : value.value;

    case "symbol":
      return Symbol(
        typeof value.description === "string" ? value.description : undefined,
      );

    case "function": {
      const placeholder = () => undefined;
      Object.defineProperty(placeholder, "name", {
        configurable: true,
        value: typeof value.name === "string" ? value.name : "anonymous",
      });
      return placeholder;
    }

    case "nan":
      return NaN;

    case "infinity":
      return Infinity;

    case "negative-infinity":
      return -Infinity;

    case "negative-zero":
      return -0;

    case "error": {
      const error = new Error(
        typeof value.message === "string" ? value.message : "",
      );

      if (typeof value.name === "string") error.name = value.name;
      if (typeof value.stack === "string") error.stack = value.stack;

      return error;
    }

    case "date":
      return new Date(typeof value.value === "string" ? value.value : NaN);

    case "regexp":
      return new RegExp(
        typeof value.source === "string" ? value.source : "",
        typeof value.flags === "string" ? value.flags : "",
      );

    case "map": {
      const entries = Array.isArray(value.entries) ? value.entries : [];

      return new Map(
        entries
          .filter(
            (entry): entry is [unknown, unknown] =>
              Array.isArray(entry) && entry.length === 2,
          )
          .map(([key, item]) => [
            deserializeConsoleValue(key),
            deserializeConsoleValue(item),
          ]),
      );
    }

    case "set":
      return new Set(
        (Array.isArray(value.values) ? value.values : []).map(
          deserializeConsoleValue,
        ),
      );

    case "array-buffer":
      return Uint8Array.from(
        Array.isArray(value.bytes)
          ? value.bytes.filter(
              (item): item is number => typeof item === "number",
            )
          : [],
      ).buffer;

    case "data-view": {
      const buffer = Uint8Array.from(
        Array.isArray(value.bytes)
          ? value.bytes.filter(
              (item): item is number => typeof item === "number",
            )
          : [],
      ).buffer;

      return new DataView(buffer);
    }

    case "typed-array": {
      const values = (Array.isArray(value.values) ? value.values : []).map(
        deserializeConsoleValue,
      );
      const constructorName = typeof value.name === "string" ? value.name : "";
      const constructor = (globalThis as unknown as Record<string, unknown>)[
        constructorName
      ];

      if (typeof constructor === "function") {
        try {
          return Reflect.construct(constructor, [values]);
        } catch {
          return values;
        }
      }

      return values;
    }

    case "html-element": {
      const outerHTML =
        typeof value.outerHTML === "string" ? value.outerHTML : "";

      if (typeof document === "undefined") {
        return outerHTML;
      }

      const template = document.createElement("template");
      template.innerHTML = outerHTML.trim();

      return template.content.firstElementChild ?? outerHTML;
    }

    case "node-list":
      return (Array.isArray(value.values) ? value.values : []).map(
        deserializeConsoleValue,
      );
  }
}

export function serializeConsoleMessage(
  message: ConsoleMessageData,
): ConsoleMessageData {
  return {
    ...message,
    data: message.data.map((value) => serializeConsoleValue(value)),
  };
}

export function deserializeConsoleMessage(
  message: ConsoleMessageData,
): ConsoleMessageData {
  return {
    ...message,
    data: message.data.map((value) => deserializeConsoleValue(value)),
  };
}

export function serializeConsoleEvent(event: ConsoleEvent): ConsoleEvent {
  return event.type === "message"
    ? { type: "message", message: serializeConsoleMessage(event.message) }
    : event;
}

export function deserializeConsoleEvent(event: ConsoleEvent): ConsoleEvent {
  return event.type === "message"
    ? {
        type: "message",
        message: deserializeConsoleMessage(event.message),
      }
    : event;
}
