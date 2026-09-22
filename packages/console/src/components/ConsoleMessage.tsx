import type { LucideIcon } from "lucide-react";
import { useContext, type ReactNode } from "react";
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
import { ConsoleValue, type ConsoleValueRenderer } from "./ConsoleValue";
import type { ConsoleMessageData, ConsoleMethod } from "../types";
import type { ConsoleLinkProvider } from "../links/types";

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

/** Context provided to custom structured-message renderers. */
export interface ConsoleMessageRendererContext {
  index: number;
  messages: readonly ConsoleMessageData[];
  renderDefault: () => ReactNode;
}

/**
 * Custom renderer for structured console messages.
 *
 * Returning `undefined` allows the next renderer, or the built-in renderer,
 * to handle the message.
 */
export interface ConsoleMessageRenderer {
  method?: ConsoleMethod;
  match?: (
    message: ConsoleMessageData,
    context: ConsoleMessageRendererContext,
  ) => boolean;
  render: (
    message: ConsoleMessageData,
    context: ConsoleMessageRendererContext,
  ) => ReactNode | undefined;
}

/** Props for rendering one structured console message. */
export interface ConsoleMessageProps {
  /** Message to render. */
  message: ConsoleMessageData;
  /** Zero-based position in the visible message list. */
  index?: number;
  /** Visible message list used by custom renderers and message actions. */
  messages?: readonly ConsoleMessageData[];
  /** Desired expanded state for every expandable value in this message. */
  allValuesExpanded?: boolean;
  /** Toggles all expandable values in this message. */
  onToggleExpansion?: () => void;
  /** Ordered custom renderers for the complete message. */
  renderers?: readonly ConsoleMessageRenderer[];
  /** Ordered custom renderers for values inside the message. */
  valueRenderers?: readonly ConsoleValueRenderer[];
  /** Whether built-in HTTP/HTTPS detection is enabled. @default true */
  detectLinks?: boolean;
  /** Ordered application-specific link providers. */
  linkProviders?: readonly ConsoleLinkProvider[];
}

function DefaultConsoleMessage({
  message,
  allValuesExpanded,
  onToggleExpansion,
  valueRenderers,
  detectLinks = true,
  linkProviders,
}: ConsoleMessageProps) {
  const style = { paddingLeft: 14 + message.depth * 16 };
  const MessageIcon = MESSAGE_ICONS[message.method] ?? Terminal;
  const expansionLabel = allValuesExpanded
    ? "Collapse all console values in this message"
    : "Expand all console values in this message";
  const icon = onToggleExpansion ? (
    <button
      type="button"
      className="console-message-icon console-message-icon-button"
      aria-label={expansionLabel}
      aria-expanded={allValuesExpanded ?? false}
      title={expansionLabel}
      onClick={onToggleExpansion}
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
          detectLinks={detectLinks}
          linkProviders={linkProviders}
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
          allValuesExpanded={allValuesExpanded}
          renderers={valueRenderers}
          detectLinks={detectLinks}
          linkProviders={linkProviders}
          linkContext={{ mode: "console" }}
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
            allValuesExpanded={allValuesExpanded}
            renderers={valueRenderers}
            detectLinks={detectLinks}
            linkProviders={linkProviders}
            linkContext={{ mode: "console" }}
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
  allValuesExpanded,
  onToggleExpansion,
  renderers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
}: ConsoleMessageProps) {
  const sourceMessages = messages ?? [message];
  const contextMenu = useContext(ConsoleContextMenuContext);
  const renderDefault = () => (
    <DefaultConsoleMessage
      message={message}
      index={index}
      messages={sourceMessages}
      allValuesExpanded={allValuesExpanded}
      onToggleExpansion={onToggleExpansion}
      valueRenderers={valueRenderers}
      detectLinks={detectLinks}
      linkProviders={linkProviders}
    />
  );

  const rendererContext = {
    index,
    messages: sourceMessages,
    renderDefault,
  };
  let renderedMessage: ReactNode | undefined;

  for (const renderer of renderers ?? []) {
    try {
      if (renderer.method && renderer.method !== message.method) continue;
      if (renderer.match && !renderer.match(message, rendererContext)) continue;

      const rendered = renderer.render(message, rendererContext);

      if (rendered !== undefined) {
        renderedMessage = rendered;
        break;
      }
    } catch {
      // A custom renderer must not prevent the console from rendering.
    }
  }

  if (renderedMessage === undefined) {
    renderedMessage = renderDefault();
  }

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
