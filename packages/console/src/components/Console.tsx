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
import { ConsoleMessage } from "./ConsoleMessage";
import {
  ConsoleStdout,
  type ConsoleStdoutEntry,
} from "./ConsoleStdout";
import type { ConsoleMessageData, RunOutput } from "../types";
import { writeClipboardText } from "../utils/clipboard";

export type ConsoleMode = "console" | "ansi";

export type ConsoleMessageFilter = (
  message: ConsoleMessageData,
  index: number,
  messages: readonly ConsoleMessageData[],
) => boolean;

interface ConsoleSharedProps {
  onClear?: () => void;
  autoScroll?: boolean;
  showHeader?: boolean;
  showClearButton?: boolean;
  actions?: ReactNode;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
  style?: CSSProperties;
}

export interface ConsoleMessageModeProps extends ConsoleSharedProps {
  mode?: "console";
  output?: RunOutput;
  messages?: ConsoleMessageData[];
  error?: string;
  onMessagesChange?: (messages: readonly ConsoleMessageData[]) => void;
  filter?: ConsoleMessageFilter;
}

export interface ConsoleAnsiModeProps extends ConsoleSharedProps {
  mode: "ansi";
  messages?: readonly (ConsoleStdoutEntry | string)[];
  parseStructuredOutput?: boolean;
  output?: never;
  error?: never;
  onMessagesChange?: never;
  filter?: never;
}

export type ConsoleProps = ConsoleMessageModeProps | ConsoleAnsiModeProps;

interface ConsoleFrameProps extends ConsoleSharedProps {
  mode: ConsoleMode;
  hasMessages: boolean;
  isEmpty: boolean;
  scrollKey: unknown;
  children: ReactNode;
}

const EMPTY_MESSAGES: ConsoleMessageData[] = [];
const EMPTY_ANSI_MESSAGES: readonly (ConsoleStdoutEntry | string)[] = [];
const AUTO_SCROLL_THRESHOLD = 24;

function ConsoleFrame({
  mode,
  onClear,
  autoScroll = true,
  showHeader = true,
  showClearButton = true,
  actions,
  title = "Console",
  subtitle,
  emptyMessage,
  className = "",
  style,
  hasMessages,
  isEmpty,
  scrollKey,
  children,
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

function ConsoleMessageMode({
  output,
  messages: messagesProp,
  error: errorProp,
  onMessagesChange,
  filter,
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
    >
      {visibleMessages.map((message, index) => (
        <ConsoleMessage
          key={
            message.id ??
            `${message.method}-${message.timestamp ?? "na"}-${index}`
          }
          message={message}
          expandAllVersion={expandedMessages.get(message)}
          onExpandAll={hasExpandableValues ? expandAllCollapsed : undefined}
        />
      ))}
    </ConsoleFrame>
  );
}

function ConsoleAnsiMode({
  messages = EMPTY_ANSI_MESSAGES,
  parseStructuredOutput = false,
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
      />
    </ConsoleFrame>
  );
}

export function Console(props: ConsoleProps) {
  if (props.mode === "ansi") {
    return <ConsoleAnsiMode {...props} />;
  }

  return <ConsoleMessageMode {...props} />;
}
