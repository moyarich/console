import type { LucideIcon } from "lucide-react";
import { useContext } from "react";
import {
  Braces,
  Bug,
  ChevronDown,
  CircleX,
  Hash,
  Info,
  ListTree,
  Table2,
  Terminal,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { ConsoleTable } from "./ConsoleTable";
import { ConsoleContextMenuContext } from "../context/ConsoleContextMenuContext";
import { ConsoleValue } from "./ConsoleValue";
import {
  dispatchMessageRenderer,
  type ConsoleMessageRenderer,
  type ConsoleValueRenderer,
} from "../renderers";
import type { ConsoleMessageData } from "../types";

type MessageIconMap = {
  [Method in ConsoleMessageData["method"]]?: LucideIcon;
};

const MESSAGE_ICONS: MessageIconMap = {
  debug: Bug,
  info: Info,
  warn: TriangleAlert,
  assert: TriangleAlert,
  error: CircleX,
  dir: Braces,
  table: Table2,
  count: Hash,
  timeEnd: Timer,
  trace: ListTree,
  group: ChevronDown,
  groupCollapsed: ChevronDown,
};

/** Props for rendering one structured console message. */
export interface ConsoleMessageProps {
  /** Message to render. */
  message: ConsoleMessageData;
  /** Zero-based position in the visible message list. */
  index?: number;
  /** Visible message list used by custom renderers and message actions. */
  messages?: readonly ConsoleMessageData[];
  /** Token used to force expandable values in this message open. */
  expandAllVersion?: number;
  /** Optional handler exposed through the message icon to expand all values. */
  onExpandAll?: () => void;
  /** Ordered custom renderers for the complete message. */
  renderers?: readonly ConsoleMessageRenderer[];
  /** Ordered custom renderers for values inside the message. */
  valueRenderers?: readonly ConsoleValueRenderer[];
}

function DefaultConsoleMessage({
  message,
  expandAllVersion,
  onExpandAll,
  valueRenderers,
}: ConsoleMessageProps) {
  const style = { paddingLeft: 14 + message.depth * 16 };
  const MessageIcon = MESSAGE_ICONS[message.method] ?? Terminal;
  const icon = onExpandAll ? (
    <button
      type="button"
      className="console-message-icon console-message-icon-button"
      aria-label="Expand all collapsed console values"
      title="Expand all collapsed console values"
      onClick={onExpandAll}
    >
      <MessageIcon size={14} strokeWidth={1.8} aria-hidden="true" />
    </button>
  ) : (
    <span className="console-message-icon" aria-hidden="true">
      <MessageIcon size={14} strokeWidth={1.8} />
    </span>
  );

  if (message.method === "table") {
    return (
      <div
        className="console-message console-message-table"
        data-method={message.method}
        style={style}
      >
        {icon}
        <ConsoleTable
          data={message.data[0]}
          columns={message.columns}
          valueRenderers={valueRenderers}
        />
      </div>
    );
  }

  if (message.method === "dir" && message.data.length === 1) {
    return (
      <div
        className="console-message"
        data-method={message.method}
        style={style}
      >
        {icon}
        <ConsoleValue
          value={message.data[0]}
          expandLevel={message.expandLevel ?? 1}
          expandAllVersion={expandAllVersion}
          renderers={valueRenderers}
        />
      </div>
    );
  }

  return (
    <div className="console-message" data-method={message.method} style={style}>
      {icon}
      <div className="console-values">
        {message.data.map((value, valueIndex) => (
          <ConsoleValue
            key={valueIndex}
            value={value}
            expandAllVersion={expandAllVersion}
            renderers={valueRenderers}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Renders a structured console message using built-in behavior or the first
 * matching custom message renderer.
 */
export function ConsoleMessage({
  message,
  index = 0,
  messages,
  expandAllVersion,
  onExpandAll,
  renderers,
  valueRenderers,
}: ConsoleMessageProps) {
  const sourceMessages = messages ?? [message];
  const contextMenu = useContext(ConsoleContextMenuContext);
  const renderDefault = () => (
    <DefaultConsoleMessage
      message={message}
      index={index}
      messages={sourceMessages}
      expandAllVersion={expandAllVersion}
      onExpandAll={onExpandAll}
      valueRenderers={valueRenderers}
    />
  );

  const custom = dispatchMessageRenderer(renderers, message, {
    index,
    messages: sourceMessages,
    renderDefault,
  });

  const renderedMessage = custom === undefined ? renderDefault() : custom;

  if (!contextMenu?.messageContextEnabled) {
    return renderedMessage;
  }

  return (
    <div
      className="console-message-action-target"
      role="group"
      aria-label={`${message.method} console message`}
      tabIndex={0}
      onContextMenu={(event) =>
        contextMenu.openForMessage(event, message, index, sourceMessages)
      }
    >
      {renderedMessage}
    </div>
  );
}
