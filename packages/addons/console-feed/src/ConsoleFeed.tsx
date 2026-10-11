import { Fragment } from "react";
import type { ConsoleMessageData } from "@moyarich/console";

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "symbol") return String(value);
  if (typeof value === "function") return `ƒ ${value.name || "anonymous"}()`;
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, nested: unknown) => {
      if (typeof nested === "bigint") return `${nested}n`;
      if (typeof nested === "object" && nested !== null) {
        if (seen.has(nested)) return "[Circular]";
        seen.add(nested);
      }
      return nested;
    }, 2) ?? String(value);
  } catch {
    return "[Unserializable]";
  }
}

/** Accessible, lightweight feed presentation for retained console messages. */
export function ConsoleFeed({ messages }: { messages: readonly ConsoleMessageData[] }) {
  return (
    <div className="console-feed" aria-label="Console message feed">
      {messages.map((message, index) => {
        const severity = message.method === "error" || message.method === "warn" || message.method === "info"
          ? message.method
          : "log";
        return (
          <article
            className="console-feed-entry"
            data-severity={severity}
            key={message.id ?? index}
            style={{ marginInlineStart: `${Math.max(0, message.depth) * 12}px` }}
          >
            <span className="console-feed-kind">{severity}</span>
            <div className="console-feed-body">
              {message.data.map((value, valueIndex) => (
                <Fragment key={valueIndex}>
                  {valueIndex > 0 ? " " : null}
                  <pre className="console-feed-value">{displayValue(value)}</pre>
                </Fragment>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
