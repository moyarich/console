import { MoreHorizontal, SquareTerminal, Trash2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
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
import { ConsoleStdout, type ConsoleStdoutEntry } from "./ConsoleStdout";
import type { ConsoleMessageData, RunOutput } from "../types";

export type ConsoleMessageFilter = (
  message: ConsoleMessageData,
  index: number,
  messages: readonly ConsoleMessageData[],
) => boolean;

export type ConsoleView = "console" | "stdout";

export interface ConsoleRef {
  reset(): void;
}

export interface ConsoleProps {
  output?: RunOutput;
  messages?: ConsoleMessageData[];
  stdout?: readonly (ConsoleStdoutEntry | string)[];
  view?: ConsoleView;
  defaultView?: ConsoleView;
  onViewChange?: (view: ConsoleView) => void;
  consoleTabLabel?: string;
  stdoutTabLabel?: string;
  showViewTabs?: boolean;
  error?: string;
  onClear?: () => void;
  onClearStdout?: () => void;
  onMessagesChange?: (messages: readonly ConsoleMessageData[]) => void;
  filter?: ConsoleMessageFilter;
  autoScroll?: boolean;
  showHeader?: boolean;
  showClearButton?: boolean;
  actions?: ReactNode;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  stdoutEmptyMessage?: string;
  className?: string;
  style?: CSSProperties;
}

const EMPTY_MESSAGES: ConsoleMessageData[] = [];
const EMPTY_STDOUT: readonly (ConsoleStdoutEntry | string)[] = [];
const AUTO_SCROLL_THRESHOLD = 24;

export const Console = forwardRef<ConsoleRef, ConsoleProps>(function Console(
  {
    output,
    messages: messagesProp,
    stdout: stdoutProp,
    view: viewProp,
    defaultView = "console",
    onViewChange,
    consoleTabLabel = "Console",
    stdoutTabLabel = "Stdout",
    showViewTabs,
    error: errorProp,
    onClear,
    onClearStdout,
    onMessagesChange,
    filter,
    autoScroll = true,
    showHeader = true,
    showClearButton = true,
    actions,
    title = "Console",
    subtitle = "Runtime output from console.*()",
    emptyMessage = "No console output yet.",
    stdoutEmptyMessage = "No stdout output yet.",
    className = "",
    style,
  },
  ref,
) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [internalView, setInternalView] = useState<ConsoleView>(defaultView);
  const hasStdoutView = stdoutProp !== undefined;
  const view =
    (viewProp ?? internalView) === "stdout" && hasStdoutView
      ? "stdout"
      : "console";
  const stdout = stdoutProp ?? EMPTY_STDOUT;
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
  const hasConsoleMessages = messages.length > 0;
  const hasActiveOutput =
    view === "stdout" ? stdout.length > 0 : hasConsoleMessages;
  const isEmpty =
    view === "stdout" ? stdout.length === 0 : visibleMessages.length === 0;

  const clearConsole = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const clearStdout = useCallback(() => {
    onClearStdout?.();
  }, [onClearStdout]);

  const reset = useCallback(() => {
    onClear?.();
    onClearStdout?.();
  }, [onClear, onClearStdout]);

  const clearActive = view === "stdout" ? clearStdout : clearConsole;
  const canClearActive =
    view === "stdout" ? Boolean(onClearStdout) : Boolean(onClear);
  const [expandedMessages, setExpandedMessages] = useState<
    Map<ConsoleMessageData, number>
  >(() => new Map());

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  useEffect(() => {
    onMessagesChange?.(sourceMessages);
  }, [onMessagesChange, sourceMessages]);

  useEffect(() => {
    if (!actionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (actionsRef.current?.contains(target)) return;
      if (actionsButtonRef.current?.contains(target)) return;

      setActionsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setActionsOpen(false);
      actionsButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionsOpen]);

  useEffect(() => {
    const surface = surfaceRef.current;

    if (!autoScroll || !surface || !shouldAutoScrollRef.current) {
      return;
    }

    surface.scrollTop = surface.scrollHeight;
  }, [autoScroll, stdout, view, visibleMessages]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const surface = event.currentTarget;
    const distanceFromBottom =
      surface.scrollHeight - surface.scrollTop - surface.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom <= AUTO_SCROLL_THRESHOLD;
  };

  const changeView = (nextView: ConsoleView) => {
    if (nextView === "stdout" && !hasStdoutView) return;

    if (viewProp === undefined) {
      setInternalView(nextView);
    }

    shouldAutoScrollRef.current = true;
    onViewChange?.(nextView);
  };

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

  const shouldShowViewTabs = hasStdoutView && (showViewTabs ?? true);
  const showActions = actions || (showClearButton && canClearActive);

  return (
    <article
      className={`console console-panel ${className}`.trim()}
      style={style}
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
                <p>{subtitle}</p>
              </div>
            </div>
          </div>

          {(shouldShowViewTabs || showActions) && (
            <div className="console-toolbar">
              {shouldShowViewTabs && (
                <div
                  className="console-view-tabs"
                  role="tablist"
                  aria-label="Console output view"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === "console"}
                    className="console-view-tab"
                    onClick={() => changeView("console")}
                  >
                    {consoleTabLabel}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === "stdout"}
                    className="console-view-tab"
                    onClick={() => changeView("stdout")}
                  >
                    {stdoutTabLabel}
                  </button>
                </div>
              )}

              {showActions && (
                <div className="console-actions-popover-shell">
                  <button
                    ref={actionsButtonRef}
                    type="button"
                    className="console-actions-trigger"
                    aria-label="Console actions"
                    aria-expanded={actionsOpen}
                    aria-controls="console-actions-popover"
                    title="Console actions"
                    onClick={() => setActionsOpen((open) => !open)}
                  >
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>

                  {actionsOpen && (
                    <div
                      ref={actionsRef}
                      id="console-actions-popover"
                      className="console-actions-popover"
                      aria-label="Console actions"
                      onClickCapture={(event) => {
                        const target = event.target;

                        if (
                          target instanceof Element &&
                          target.closest("button, a, [role='menuitem']")
                        ) {
                          setActionsOpen(false);
                        }
                      }}
                    >
                      <div className="console-actions result-actions">
                        {actions}

                        {showClearButton && canClearActive && (
                          <button
                            type="button"
                            className="console-clear-button"
                            disabled={!hasActiveOutput}
                            onClick={clearActive}
                          >
                            <Trash2 size={14} aria-hidden="true" /> Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConsoleContextMenu
        disabled={!hasActiveOutput || !canClearActive}
        onClear={clearActive}
      >
        <div
          ref={surfaceRef}
          className="console-surface"
          role="log"
          aria-live="polite"
          onScroll={handleScroll}
        >
          {view === "stdout" ? (
            <ConsoleStdout entries={stdout} emptyMessage={stdoutEmptyMessage} />
          ) : isEmpty ? (
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
