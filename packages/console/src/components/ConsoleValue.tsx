import { ChevronRight, Copy } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useConsoleContextMenu } from "../hooks/useConsoleContextMenu";
import {
  dispatchValueRenderer,
  getConsoleValueType,
  type ConsoleValueRenderer,
} from "../renderers";

export interface ConsoleValueProps {
  value: unknown;
  expandLevel?: number;
  ancestors?: ReadonlySet<object>;
  propertyKey?: string;
  expandAllVersion?: number;
  renderers?: readonly ConsoleValueRenderer[];
}

interface ConsoleObjectValueProps {
  value: object;
  expandLevel: number;
  ancestors: ReadonlySet<object>;
  propertyKey?: string;
  expandAllVersion?: number;
  renderers?: readonly ConsoleValueRenderer[];
}

function isObjectLike(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function isElementLike(
  value: unknown,
): value is object & { outerHTML: string } {
  if (!isObjectLike(value)) return false;

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

function isInspectableObject(value: unknown): value is object {
  return (
    isObjectLike(value) &&
    !isElementLike(value) &&
    !(value instanceof Error) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

function typeClass(value: unknown): string {
  if (value === null) return "console-null";
  if (typeof value === "string") return "console-string";
  if (typeof value === "number" || typeof value === "bigint")
    return "console-number";
  if (typeof value === "boolean") return "console-boolean";
  if (typeof value === "undefined") return "console-undefined";
  if (typeof value === "symbol") return "console-symbol";
  return "";
}

function renderPrimitive(value: unknown): ReactNode {
  if (isElementLike(value))
    return <span className="console-html">{value.outerHTML}</span>;
  if (value instanceof Error)
    return <pre className="console-stack">{value.stack || value.message}</pre>;
  if (typeof value === "function")
    return (
      <span className="console-function">ƒ {value.name || "anonymous"}()</span>
    );
  if (typeof value === "string")
    return <span className="console-string">{JSON.stringify(value)}</span>;
  if (typeof value === "symbol")
    return <span className="console-symbol">{String(value)}</span>;
  if (value === null) return <span className="console-null">null</span>;
  if (typeof value === "undefined")
    return <span className="console-undefined">undefined</span>;
  return <span className={typeClass(value)}>{String(value)}</span>;
}

function objectLabel(value: object): string {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (isMapLike(value)) return `Map(${value.size})`;
  if (isSetLike(value)) return `Set(${value.size})`;
  if (value instanceof ArrayBuffer) return `ArrayBuffer(${value.byteLength})`;
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const length = (value as unknown as { length?: number }).length;
    return `${value.constructor.name}(${length ?? value.byteLength})`;
  }

  const constructorName = value.constructor?.name;
  return constructorName && constructorName !== "Object"
    ? constructorName
    : "Object";
}

function objectEntries(value: object): [string, unknown][] {
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

function preview(value: object): string {
  if (isMapLike(value)) return `{ ${value.size} entries }`;
  if (isSetLike(value)) return `{ ${value.size} values }`;

  if (Array.isArray(value)) {
    const items = value.slice(0, 3).map((item) => {
      if (typeof item === "string") return JSON.stringify(item);
      if (isObjectLike(item)) return Array.isArray(item) ? "Array" : "Object";
      return String(item);
    });
    return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
  }

  const entries = objectEntries(value).slice(0, 3);
  const parts = entries.map(([key, item]) => {
    if (typeof item === "string") return `${key}: ${JSON.stringify(item)}`;
    if (isObjectLike(item))
      return `${key}: ${Array.isArray(item) ? "Array" : "Object"}`;
    return `${key}: ${String(item)}`;
  });
  return `{ ${parts.join(", ")}${Object.keys(value).length > 3 ? ", …" : ""} }`;
}

function ConsoleObjectValue({
  value,
  expandLevel,
  ancestors,
  propertyKey,
  expandAllVersion,
  renderers,
}: ConsoleObjectValueProps) {
  const { copyObject, openForValue } = useConsoleContextMenu();
  const [isOpen, setIsOpen] = useState(
    expandLevel > 0 || expandAllVersion !== undefined,
  );

  useEffect(() => {
    if (expandAllVersion !== undefined) {
      setIsOpen(true);
    }
  }, [expandAllVersion]);

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  const entries = objectEntries(value);
  const depth = ancestors.size;

  return (
    <div
      className="console-object-shell"
      data-depth={depth}
      onContextMenu={(event) => openForValue(event, value)}
    >
      <details
        className="console-object"
        open={isOpen}
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
      >
        <summary data-console-object-key={propertyKey}>
          <ChevronRight
            className="console-object-chevron"
            size={13}
            aria-hidden="true"
          />
          {propertyKey && (
            <>
              <span
                className="console-property-key console-object-property-key"
                title={propertyKey}
              >
                {propertyKey}
              </span>
              <span className="console-property-separator">:</span>
            </>
          )}
          <span className="console-object-type">{objectLabel(value)}</span>
          <span className="console-object-preview">{preview(value)}</span>
        </summary>

        <button
          type="button"
          className="console-object-copy-button"
          aria-label={
            propertyKey ? `Copy ${propertyKey} object` : "Copy object"
          }
          title={propertyKey ? `Copy ${propertyKey} object` : "Copy object"}
          onClick={(event) => {
            event.stopPropagation();
            copyObject(value);
          }}
          onContextMenu={(event) => event.stopPropagation()}
        >
          <Copy size={12} aria-hidden="true" />
        </button>

        {isOpen && (
          <div className="console-object-properties">
            {entries.length ? (
              entries.map(([key, child]) => {
                const nestedObject =
                  isInspectableObject(child) && !nextAncestors.has(child);

                if (nestedObject) {
                  return (
                    <ConsoleValue
                      key={key}
                      value={child}
                      propertyKey={key}
                      expandLevel={Math.max(0, expandLevel - 1)}
                      ancestors={nextAncestors}
                      expandAllVersion={expandAllVersion}
                      renderers={renderers}
                    />
                  );
                }

                return (
                  <div
                    className="console-property"
                    data-console-property-key={key}
                    key={key}
                  >
                    <span className="console-property-key" title={key}>
                      {key}
                    </span>
                    <span className="console-property-separator">:</span>
                    <div className="console-property-value">
                      <ConsoleValue
                        value={child}
                        expandLevel={Math.max(0, expandLevel - 1)}
                        ancestors={nextAncestors}
                        expandAllVersion={expandAllVersion}
                        renderers={renderers}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="console-object-empty">
                No enumerable properties
              </div>
            )}
          </div>
        )}
      </details>
    </div>
  );
}

function renderDefaultValue({
  value,
  expandLevel,
  ancestors,
  propertyKey,
  expandAllVersion,
  renderers,
}: Required<Pick<ConsoleValueProps, "expandLevel" | "ancestors">> &
  Omit<ConsoleValueProps, "expandLevel" | "ancestors">): ReactNode {
  if (!isObjectLike(value)) return renderPrimitive(value);
  if (!isInspectableObject(value)) return renderPrimitive(value);
  if (ancestors.has(value))
    return <span className="console-circular">[Circular]</span>;

  return (
    <ConsoleObjectValue
      value={value}
      expandLevel={expandLevel}
      ancestors={ancestors}
      propertyKey={propertyKey}
      expandAllVersion={expandAllVersion}
      renderers={renderers}
    />
  );
}

export function ConsoleValue({
  value,
  expandLevel = 0,
  ancestors = new Set<object>(),
  propertyKey,
  expandAllVersion,
  renderers,
}: ConsoleValueProps) {
  const renderDefault = () =>
    renderDefaultValue({
      value,
      expandLevel,
      ancestors,
      propertyKey,
      expandAllVersion,
      renderers,
    });

  const custom = dispatchValueRenderer(renderers, value, {
    propertyKey,
    depth: ancestors.size,
    type: getConsoleValueType(value),
    renderDefault,
  });

  return custom === undefined ? renderDefault() : custom;
}
