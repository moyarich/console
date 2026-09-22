import { ChevronRight, Copy } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useConsoleContextMenu } from "../hooks/useConsoleContextMenu";
import { isElementLike } from "../utils/values/isElementLike";
import { isInspectableObject } from "../utils/values/isInspectableObject";
import { isObjectLike } from "../utils/values/isObjectLike";
import { objectEntries } from "../utils/values/objectEntries";
import { objectLabel } from "../utils/values/objectLabel";
import { preview } from "../utils/values/preview";
import { typeClass } from "../utils/style/typeClass";
import { ConsoleLinkedText } from "./ConsoleLinkedText";
import type {
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
} from "../links";
import {
  dispatchValueRenderer,
  getConsoleValueType,
  type ConsoleValueRenderer,
} from "../renderers";

/** Props for rendering a single console value. */
export interface ConsoleValueProps {
  value: unknown;
  expandLevel?: number;
  ancestors?: ReadonlySet<object>;
  propertyKey?: string;
  expandAllVersion?: number;
  renderers?: readonly ConsoleValueRenderer[];
  detectLinks?: boolean;
  linkProviders?: readonly ConsoleLinkProvider[];
  linkContext?: Omit<ConsoleLinkProviderContext, "value" | "propertyKey">;
}

interface ConsoleObjectValueProps {
  value: object;
  expandLevel: number;
  ancestors: ReadonlySet<object>;
  propertyKey?: string;
  expandAllVersion?: number;
  renderers?: readonly ConsoleValueRenderer[];
  detectLinks?: boolean;
  linkProviders?: readonly ConsoleLinkProvider[];
  linkContext?: Omit<ConsoleLinkProviderContext, "value" | "propertyKey">;
}

function renderPrimitive(
  value: unknown,
  propertyKey: string | undefined,
  detectLinks: boolean,
  linkProviders: readonly ConsoleLinkProvider[] | undefined,
  linkContext:
    Omit<ConsoleLinkProviderContext, "value" | "propertyKey"> | undefined,
): ReactNode {
  const context: ConsoleLinkProviderContext = {
    mode: linkContext?.mode ?? "console",
    ...linkContext,
    value,
    propertyKey,
  };

  if (isElementLike(value))
    return <span className="console-html">{value.outerHTML}</span>;

  if (value instanceof Error) {
    const text = value.stack || value.message;
    return (
      <pre className="console-stack">
        <ConsoleLinkedText
          text={text}
          context={context}
          detectLinks={detectLinks}
          providers={linkProviders}
        />
      </pre>
    );
  }

  if (typeof value === "function")
    return (
      <span className="console-function">ƒ {value.name || "anonymous"}()</span>
    );

  if (typeof value === "string")
    return (
      <span className="console-string">
        "
        <ConsoleLinkedText
          text={value}
          context={context}
          detectLinks={detectLinks}
          providers={linkProviders}
        />
        "
      </span>
    );

  if (typeof value === "symbol")
    return <span className="console-symbol">{String(value)}</span>;
  if (value === null) return <span className="console-null">null</span>;
  if (typeof value === "undefined")
    return <span className="console-undefined">undefined</span>;
  return <span className={typeClass(value)}>{String(value)}</span>;
}

function ConsoleObjectValue({
  value,
  expandLevel,
  ancestors,
  propertyKey,
  expandAllVersion,
  renderers,
  detectLinks,
  linkProviders,
  linkContext,
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
                      detectLinks={detectLinks}
                      linkProviders={linkProviders}
                      linkContext={linkContext}
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
                        detectLinks={detectLinks}
                        linkProviders={linkProviders}
                        linkContext={linkContext}
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
  detectLinks = true,
  linkProviders,
  linkContext,
}: Required<Pick<ConsoleValueProps, "expandLevel" | "ancestors">> &
  Omit<ConsoleValueProps, "expandLevel" | "ancestors">): ReactNode {
  if (!isObjectLike(value))
    return renderPrimitive(
      value,
      propertyKey,
      detectLinks,
      linkProviders,
      linkContext,
    );
  if (!isInspectableObject(value))
    return renderPrimitive(
      value,
      propertyKey,
      detectLinks,
      linkProviders,
      linkContext,
    );
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
      detectLinks={detectLinks}
      linkProviders={linkProviders}
      linkContext={linkContext}
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
  detectLinks = true,
  linkProviders,
  linkContext,
}: ConsoleValueProps) {
  const renderDefault = () =>
    renderDefaultValue({
      value,
      expandLevel,
      ancestors,
      propertyKey,
      expandAllVersion,
      renderers,
      detectLinks,
      linkProviders,
      linkContext,
    });

  const custom = dispatchValueRenderer(renderers, value, {
    propertyKey,
    depth: ancestors.size,
    type: getConsoleValueType(value),
    renderDefault,
  });

  return custom === undefined ? renderDefault() : custom;
}
