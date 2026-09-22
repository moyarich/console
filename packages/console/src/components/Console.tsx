import { Copy, MoreHorizontal, SquareTerminal, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";
import { ConsoleContextMenu } from "./ConsoleContextMenu";
import {
  ConsoleMessage,
  type ConsoleMessageRenderer,
} from "./ConsoleMessage";
import {
  ConsoleStdout,
  type ConsoleProcessOutputProcessor,
  type ConsoleStdoutEntry,
  type ConsoleStructuredOutputParser,
} from "./ConsoleStdout";
import type { ConsoleValueRenderer } from "./ConsoleValue";
import type {
  ConsoleMessageData,
  ConsoleMode as ConsoleModeType,
} from "../types";
import type {
  ConsoleContextMenuAction,
  ConsoleMessageAction,
} from "../actions";
import { writeClipboardText } from "../utils/browser/clipboard";
import type { ConsoleLinkProvider } from "../links/types";

/** Standard run result shape accepted by structured console mode. */
export interface RunOutput {
  messages: ConsoleMessageData[];
  error?: string;
}

/** Rendering mode selected by the top-level console component. */
export type ConsoleMode = ConsoleModeType;
/** CSS resize direction supported by the console shell. */
export type ConsoleResizeDirection =
  "vertical" | "horizontal" | "both" | "block" | "inline";

/**
 * Predicate used to decide whether a structured message should be visible.
 */
export type ConsoleMessageFilter = (
  message: ConsoleMessageData,
  index: number,
  messages: readonly ConsoleMessageData[],
) => boolean;

/** Props shared by structured and ANSI console modes. */
interface ConsoleSharedProps {
  /** Called by the built-in clear action. Omit to disable clear behavior. */
  onClear?: () => void;
  /** Keep the output pinned to the bottom while the user remains near it. @default true */
  autoScroll?: boolean;
  /** Enables native CSS resizing in the requested direction. */
  resizable?: ConsoleResizeDirection;
  /** Whether to render the panel header. @default true */
  showHeader?: boolean;
  /** Whether to include the built-in clear command when `onClear` is provided. @default true */
  showClearButton?: boolean;
  /** Additional React content rendered in the header actions popover. */
  actions?: ReactNode;
  /** Host-defined actions available from the right-click context menu. */
  contextMenuActions?: readonly ConsoleContextMenuAction[];
  /** Header title. @default "Console" */
  title?: string;
  /** Optional header subtitle. Mode-specific defaults are used when omitted. */
  subtitle?: string;
  /** Message shown when the selected mode has no visible output. */
  emptyMessage?: string;
  /** Additional class names applied to the root console element. */
  className?: string;
  /** Inline styles applied to the root console element, including public theme variables. */
  style?: CSSProperties;
  /** Custom renderers for values displayed by either console mode. */
  valueRenderers?: readonly ConsoleValueRenderer[];
  /** Whether built-in HTTP/HTTPS link detection is enabled. @default true */
  detectLinks?: boolean;
  /** Ordered application-specific link providers used in either mode. */
  linkProviders?: readonly ConsoleLinkProvider[];
}

/** Props for browser-style structured console rendering. */
export interface ConsoleMessageModeProps extends ConsoleSharedProps {
  /** Selects structured console mode. This is the default mode. */
  mode?: "console";
  /** Run result used as an alternative source of messages and runtime error text. */
  output?: RunOutput;
  /** Structured messages to render. Takes precedence over `output.messages`. */
  messages?: ConsoleMessageData[];
  /** Optional runtime error appended as a synthetic error message. */
  error?: string;
  /** Observes the unfiltered source message collection. */
  onMessagesChange?: (messages: readonly ConsoleMessageData[]) => void;
  /** Controls which structured messages are visible. */
  filter?: ConsoleMessageFilter;
  /** Ordered custom renderers for complete structured messages. */
  messageRenderers?: readonly ConsoleMessageRenderer[];
  /** Host-defined actions shown for a selected structured message. */
  messageActions?: readonly ConsoleMessageAction[];
}

/** Props for terminal-style ANSI/process-output rendering. */
export interface ConsoleAnsiModeProps extends ConsoleSharedProps {
  /** Selects ANSI/process-output mode. */
  mode: "ansi";
  /** ANSI-aware stdout/stderr entries or raw strings to render. */
  messages?: readonly (ConsoleStdoutEntry | string)[];
  /** Parse complete JSON object/array lines into structured value inspectors. */
  parseStructuredOutput?: boolean;
  /** Ordered process-output processors applied before structured parsing/rendering. */
  processors?: readonly ConsoleProcessOutputProcessor[];
  /** Ordered custom parsers that can promote text lines into structured values. */
  structuredOutputParsers?: readonly ConsoleStructuredOutputParser[];
  output?: never;
  error?: never;
  onMessagesChange?: never;
  filter?: never;
  messageRenderers?: never;
}

/** Discriminated prop union for the top-level {@link Console} component. */
export type ConsoleProps = ConsoleMessageModeProps | ConsoleAnsiModeProps;

interface ConsoleFrameProps extends ConsoleSharedProps {
  mode: ConsoleMode;
  hasMessages: boolean;
  isEmpty: boolean;
  scrollKey: unknown;
  children: ReactNode;
  messageActions?: readonly ConsoleMessageAction[];
}

const EMPTY_MESSAGES: ConsoleMessageData[] = [];
const EMPTY_ANSI_MESSAGES: readonly (ConsoleStdoutEntry | string)[] = [];
const AUTO_SCROLL_THRESHOLD = 24;

/**
 * Shared frame that renders panel chrome, actions, context-menu support, and
 * the scrollable output surface for both console modes.
 */
function ConsoleFrame({
  mode,
  onClear,
  autoScroll = true,
  resizable,
  showHeader = true,
  showClearButton = true,
  actions,
  contextMenuActions,
  title = "Console",
  subtitle,
  emptyMessage,
  className = "",
  style,
  hasMessages,
  isEmpty,
  scrollKey,
  children,
  messageActions,
}: ConsoleFrameProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const actionsPopoverId = useId();
  const clear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const copyOutput = useCallback(() => {
    const value = surfaceRef.current?.innerText.trim() ?? "";

    if (value) {
      void writeClipboardText(value);
    }
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;

    if (!autoScroll || !surface || !shouldAutoScrollRef.current) {
      return;
    }

    surface.scrollTop = surface.scrollHeight;
  }, [autoScroll, scrollKey]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const surface = event.currentTarget;
    const distanceFromBottom =
      surface.scrollHeight - surface.scrollTop - surface.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom <= AUTO_SCROLL_THRESHOLD;
  };

  const showCopyButton = mode === "ansi";
  const showActions = actions || showCopyButton || (showClearButton && onClear);

  return (
    <article
      className={`console console-panel ${className}`.trim()}
      style={style}
      data-console-mode={mode}
      data-resizable={resizable}
    >
      {showHeader && (
        <div className="console-panel-header panel-header">
          <div className="console-panel-header-main">
            <div className="console-heading">
              <SquareTerminal
                className="console-heading-icon"
                size={19}
                aria-hidden="true"
              />
              <div className="console-heading-copy">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>

            {showActions && (
              <div className="console-actions-popover-shell">
                <button
                  type="button"
                  className="console-actions-trigger"
                  aria-label="Console actions"
                  aria-haspopup="menu"
                  popoverTarget={actionsPopoverId}
                  title="Console actions"
                >
                  <MoreHorizontal size={18} aria-hidden="true" />
                </button>

                <div
                  id={actionsPopoverId}
                  className="console-actions-popover"
                  popover="auto"
                  aria-label="Console actions"
                  onClickCapture={(event) => {
                    const target = event.target;

                    if (
                      target instanceof Element &&
                      target.closest("button, a, [role='menuitem']")
                    ) {
                      event.currentTarget.hidePopover();
                    }
                  }}
                >
                  <div className="console-actions result-actions">
                    {actions}

                    {showCopyButton && (
                      <button
                        type="button"
                        className="console-copy-output-button"
                        disabled={!hasMessages}
                        onClick={copyOutput}
                      >
                        <Copy size={14} aria-hidden="true" /> Copy output
                      </button>
                    )}

                    {showClearButton && onClear && (
                      <button
                        type="button"
                        className="console-clear-button"
                        disabled={!hasMessages}
                        onClick={clear}
                      >
                        <Trash2 size={14} aria-hidden="true" /> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConsoleContextMenu
        mode={mode}
        hasMessages={hasMessages}
        actions={contextMenuActions}
        messageActions={messageActions}
        copyDisabled={!hasMessages}
        clearDisabled={!hasMessages || !onClear}
        onClear={onClear ? clear : undefined}
      >
        <div
          ref={surfaceRef}
          className="console-surface"
          role="log"
          aria-live="polite"
          onScroll={handleScroll}
        >
          {isEmpty ? (
            <div className="console-empty">
              <SquareTerminal
                className="console-empty-icon"
                size={28}
                aria-hidden="true"
              />
              <span>{emptyMessage}</span>
            </div>
          ) : (
            children
          )}
        </div>
      </ConsoleContextMenu>
    </article>
  );
}

/** Renders structured console messages and custom message/value renderers. */
function ConsoleMessageMode({
  output,
  messages: messagesProp,
  error: errorProp,
  onMessagesChange,
  filter,
  messageRenderers,
  messageActions,
  valueRenderers,
  detectLinks = true,
  linkProviders,
  subtitle = "Runtime output from console.*()",
  emptyMessage = "No console output yet.",
  ...frameProps
}: ConsoleMessageModeProps) {
  const sourceMessages = messagesProp ?? output?.messages ?? EMPTY_MESSAGES;
  const runtimeError = errorProp ?? output?.error ?? "";
  const messages = useMemo<ConsoleMessageData[]>(
    () =>
      runtimeError
        ? [
            ...sourceMessages,
            { method: "error", data: [runtimeError], depth: 0 },
          ]
        : sourceMessages,
    [runtimeError, sourceMessages],
  );
  const visibleMessages = useMemo(
    () =>
      filter
        ? messages.filter((message, index) => filter(message, index, messages))
        : messages,
    [filter, messages],
  );
  const [expandedMessages, setExpandedMessages] = useState<
    Map<ConsoleMessageData, number>
  >(() => new Map());

  useEffect(() => {
    onMessagesChange?.(sourceMessages);
  }, [onMessagesChange, sourceMessages]);

  const hasExpandableValues = visibleMessages.some(
    (message) =>
      message.method !== "table" &&
      message.data.some((value) => typeof value === "object" && value !== null),
  );

  const expandAllCollapsed = () => {
    setExpandedMessages((current) => {
      const version = Math.max(0, ...Array.from(current.values())) + 1;

      return new Map(visibleMessages.map((message) => [message, version]));
    });
  };

  return (
    <ConsoleFrame
      {...frameProps}
      mode="console"
      subtitle={subtitle}
      emptyMessage={emptyMessage}
      hasMessages={messages.length > 0}
      isEmpty={visibleMessages.length === 0}
      scrollKey={visibleMessages}
      messageActions={messageActions}
    >
      {visibleMessages.map((message, index) => (
        <ConsoleMessage
          key={
            message.id ??
            `${message.method}-${message.timestamp ?? "na"}-${index}`
          }
          message={message}
          index={index}
          messages={visibleMessages}
          expandAllVersion={expandedMessages.get(message)}
          onExpandAll={hasExpandableValues ? expandAllCollapsed : undefined}
          renderers={messageRenderers}
          valueRenderers={valueRenderers}
          detectLinks={detectLinks}
          linkProviders={linkProviders}
        />
      ))}
    </ConsoleFrame>
  );
}

/** Renders ANSI-aware process output with optional structured parsing. */
function ConsoleAnsiMode({
  messages = EMPTY_ANSI_MESSAGES,
  parseStructuredOutput = false,
  processors,
  structuredOutputParsers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
  subtitle = "ANSI-aware process output",
  emptyMessage = "No process output yet.",
  ...frameProps
}: ConsoleAnsiModeProps) {
  return (
    <ConsoleFrame
      {...frameProps}
      mode="ansi"
      subtitle={subtitle}
      emptyMessage={emptyMessage}
      hasMessages={messages.length > 0}
      isEmpty={messages.length === 0}
      scrollKey={messages}
    >
      <ConsoleStdout
        entries={messages}
        parseStructuredOutput={parseStructuredOutput}
        processors={processors}
        structuredOutputParsers={structuredOutputParsers}
        valueRenderers={valueRenderers}
        detectLinks={detectLinks}
        linkProviders={linkProviders}
      />
    </ConsoleFrame>
  );
}

/**
 * Renders either structured browser-console output or ANSI process output.
 *
 * Set `mode="ansi"` for terminal-style entries; omit `mode` (or use
 * `"console"`) for structured {@link ConsoleMessageData} messages.
 */
export function Console(props: ConsoleProps) {
  if (props.mode === "ansi") {
    return <ConsoleAnsiMode {...props} />;
  }

  return <ConsoleMessageMode {...props} />;
}
