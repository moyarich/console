import { ChevronRight, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useConsoleContextMenu } from "./ConsoleContextMenu";

export interface ConsoleValueProps {
  value: unknown;
  expandLevel?: number;
  ancestors?: ReadonlySet<object>;
  propertyKey?: string;
}

interface ConsoleObjectValueProps {
  value: object;
  expandLevel: number;
  ancestors: ReadonlySet<object>;
  propertyKey?: string;
}

function isObjectLike(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function isInspectableObject(value: unknown): value is object {
  return (
    isObjectLike(value) &&
    !(value instanceof Error) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

function typeClass(value: unknown): string {
  if (value === null) return "console-null";
  if (typeof value === "string") return "console-string";
  if (typeof value === "number" || typeof value === "bigint") return "console-number";
  if (typeof value === "boolean") return "console-boolean";
  if (typeof value === "undefined") return "console-undefined";
  if (typeof value === "symbol") return "console-symbol";
  return "";
}

function renderPrimitive(value: unknown): ReactNode {
  if (value instanceof Error) return <pre className="console-stack">{value.stack || value.message}</pre>;
  if (typeof value === "function") return <span className="console-function">ƒ {value.name || "anonymous"}()</span>;
  if (typeof value === "string") return <span className="console-string">{JSON.stringify(value)}</span>;
  if (typeof value === "symbol") return <span className="console-symbol">{String(value)}</span>;
  if (value === null) return <span className="console-null">null</span>;
  if (typeof value === "undefined") return <span className="console-undefined">undefined</span>;
  return <span className={typeClass(value)}>{String(value)}</span>;
}

function objectLabel(value: object): string {
  if (Array.isArray(value)) return `Array(${value.length})`;
  const constructorName = value.constructor?.name;
  return constructorName && constructorName !== "Object" ? constructorName : "Object";
}

function preview(value: object): string {
  if (Array.isArray(value)) {
    const items = value.slice(0, 3).map((item) => {
      if (typeof item === "string") return JSON.stringify(item);
      if (isObjectLike(item)) return Array.isArray(item) ? "Array" : "Object";
      return String(item);
    });
    return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
  }

  const entries = Object.entries(value).slice(0, 3);
  const parts = entries.map(([key, item]) => {
    if (typeof item === "string") return `${key}: ${JSON.stringify(item)}`;
    if (isObjectLike(item)) return `${key}: ${Array.isArray(item) ? "Array" : "Object"}`;
    return `${key}: ${String(item)}`;
  });
  return `{ ${parts.join(", ")}${Object.keys(value).length > 3 ? ", …" : ""} }`;
}

function ConsoleObjectValue({
  value,
  expandLevel,
  ancestors,
  propertyKey,
}: ConsoleObjectValueProps) {
  const { copyObject, openForValue } = useConsoleContextMenu();
  const [isOpen, setIsOpen] = useState(expandLevel > 0);

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  const entries = Object.entries(value);
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
          <ChevronRight className="console-object-chevron" size={13} aria-hidden="true" />
          {propertyKey && (
            <>
              <span className="console-property-key console-object-property-key" title={propertyKey}>
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
          aria-label={propertyKey ? `Copy ${propertyKey} object` : "Copy object"}
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
                    />
                  );
                }

                return (
                  <div className="console-property" data-console-property-key={key} key={key}>
                    <span className="console-property-key" title={key}>{key}</span>
                    <span className="console-property-separator">:</span>
                    <div className="console-property-value">
                      <ConsoleValue
                        value={child}
                        expandLevel={Math.max(0, expandLevel - 1)}
                        ancestors={nextAncestors}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="console-object-empty">No enumerable properties</div>
            )}
          </div>
        )}
      </details>
    </div>
  );
}

export function ConsoleValue({
  value,
  expandLevel = 0,
  ancestors = new Set<object>(),
  propertyKey,
}: ConsoleValueProps) {
  if (!isObjectLike(value)) return renderPrimitive(value);
  if (!isInspectableObject(value)) return renderPrimitive(value);
  if (ancestors.has(value)) return <span className="console-circular">[Circular]</span>;

  return (
    <ConsoleObjectValue
      value={value}
      expandLevel={expandLevel}
      ancestors={ancestors}
      propertyKey={propertyKey}
    />
  );
}
