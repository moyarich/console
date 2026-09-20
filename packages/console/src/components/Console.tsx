import { SquareTerminal, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { ConsoleContextMenu } from "./ConsoleContextMenu";
import { ConsoleMessage } from "./ConsoleMessage";
import type { ConsoleMessageData, RunOutput } from "../types";

export interface ConsoleProps {
  output?: RunOutput;
  messages?: ConsoleMessageData[];
  error?: string;
  onClear?: () => void;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
  style?: CSSProperties;
}

export function Console({ output, messages: messagesProp, error: errorProp, onClear, title = "Console", subtitle = "Runtime output from console.*()", emptyMessage = "No console output yet.", className = "", style }: ConsoleProps) {
  const sourceMessages = messagesProp ?? output?.messages ?? [];
  const runtimeError = errorProp ?? output?.error ?? "";
  const messages: ConsoleMessageData[] = runtimeError ? [...sourceMessages, { method: "error", data: [runtimeError], depth: 0 }] : sourceMessages;
  const isEmpty = messages.length === 0;
  const clear = onClear ?? (() => undefined);
  return (
    <article className={`console console-panel ${className}`.trim()} style={style}>
      <div className="console-panel-header panel-header">
        <div className="console-heading">
          <SquareTerminal className="console-heading-icon" size={19} aria-hidden="true" />
          <div><h2>{title}</h2><p>{subtitle}</p></div>
        </div>
        <div className="console-actions result-actions">
          <button type="button" className="console-clear-button" disabled={isEmpty || !onClear} onClick={clear}><Trash2 size={14} aria-hidden="true" /> Clear</button>
        </div>
      </div>
      <ConsoleContextMenu disabled={isEmpty || !onClear} onClear={clear}>
        <div className="console-surface" role="log" aria-live="polite">
          {isEmpty ? <div className="console-empty"><SquareTerminal className="console-empty-icon" size={28} aria-hidden="true" /><span>{emptyMessage}</span></div> : messages.map((message, index) => <ConsoleMessage key={message.id ?? `${message.method}-${message.timestamp ?? "na"}-${index}`} message={message} />)}
        </div>
      </ConsoleContextMenu>
    </article>
  );
}
