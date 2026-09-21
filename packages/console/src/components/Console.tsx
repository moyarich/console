import { SquareTerminal, Trash2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";
import { ConsoleContextMenu } from "./ConsoleContextMenu";
import { ConsoleMessage } from "./ConsoleMessage";
import type { ConsoleMessageData, RunOutput } from "../types";

export type ConsoleMessageFilter = (
  message: ConsoleMessageData,
  index: number,
  messages: readonly ConsoleMessageData[],
) => boolean;

export interface ConsoleRef {
  reset(): void;
}

export interface ConsoleProps {
  output?: RunOutput;
  messages?: ConsoleMessageData[];
  error?: string;
  onClear?: () => void;
  onMessagesChange?: (messages: readonly ConsoleMessageData[]) => void;
  filter?: ConsoleMessageFilter;
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

const EMPTY_MESSAGES: ConsoleMessageData[] = [];
const AUTO_SCROLL_THRESHOLD = 24;

export const Console = forwardRef<ConsoleRef, ConsoleProps>(function Console(
  {
    output,
    messages: messagesProp,
    error: errorProp,
    onClear,
    onMessagesChange,
    filter,
    autoScroll = true,
    showHeader = true,
    showClearButton = true,
    actions,
    title = "Console",
    subtitle = "Runtime output from console.*()",
    emptyMessage = "No console output yet.",
    className = "",
    style,
  },
  ref,
) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
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
        ? messages.filter((message, index) =>
            filter(message, index, messages),
          )
        : messages,
    [filter, messages],
  );
  const hasMessages = messages.length > 0;
  const isEmpty = visibleMessages.length === 0;
  const clear = onClear ?? (() => undefined);
  const [expandedMessages, setExpandedMessages] = useState<
    Map<ConsoleMessageData, number>
  >(() => new Map());

  useImperativeHandle(ref, () => ({ reset: clear }), [clear]);

  useEffect(() => {
    onMessagesChange?.(sourceMessages);
  }, [onMessagesChange, sourceMessages]);

  useEffect(() => {
    const surface = surfaceRef.current;

    if (!autoScroll || !surface || !shouldAutoScrollRef.current) {
      return;
    }

    surface.scrollTop = surface.scrollHeight;
  }, [autoScroll, visibleMessages]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const surface = event.currentTarget;
    const distanceFromBottom =
      surface.scrollHeight - surface.scrollTop - surface.clientHeight;

    shouldAutoScrollRef.current =
      distanceFromBottom <= AUTO_SCROLL_THRESHOLD;
  };

  const hasExpandableValues = visibleMessages.some(
    (message) =>
      message.method !== "table" &&
      message.data.some(
        (value) => typeof value === "object" && value !== null,
      ),
  );

  const expandAllCollapsed = () => {
    setExpandedMessages((current) => {
      const version = Math.max(0, ...Array.from(current.values())) + 1;

      return new Map(
        visibleMessages.map((message) => [message, version]),
      );
    });
  };

  const showActions = actions || (showClearButton && onClear);

  return (
    <article
      className={`console console-panel ${className}`.trim()}
      style={style}
    >
      {showHeader && (
        <div className="console-panel-header panel-header">
          <div className="console-heading">
            <SquareTerminal
              className="console-heading-icon"
              size={19}
              aria-hidden="true"
            />
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>

          {showActions && (
            <div className="console-actions result-actions">
              {actions}

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
          )}
        </div>
      )}

      <ConsoleContextMenu disabled={!hasMessages || !onClear} onClear={clear}>
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
            visibleMessages.map((message, index) => (
              <ConsoleMessage
                key={
                  message.id ??
                  `${message.method}-${message.timestamp ?? "na"}-${index}`
                }
                message={message}
                expandAllVersion={expandedMessages.get(message)}
                onExpandAll={
                  hasExpandableValues ? expandAllCollapsed : undefined
                }
              />
            ))
          )}
        </div>
      </ConsoleContextMenu>
    </article>
  );
});
