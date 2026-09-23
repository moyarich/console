import { Copy, MoreHorizontal, SquareTerminal, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { ConsoleContextMenu } from "./ConsoleContextMenu";
import { ConsoleMessage } from "./ConsoleMessage";
import {
  ConsoleStdout,
  type ConsoleProcessOutputProcessor,
  type ConsoleStdoutEntry,
  type ConsoleStructuredOutputParser,
} from "./ConsoleStdout";
import type {
  ConsoleMessageData,
  ConsoleMode as ConsoleModeType,
  RunOutput,
} from "../types";
import {
  dispatchOutputRenderer,
  type ConsoleMessageRenderer,
  type ConsoleOutputRenderer,
  type ConsoleValueRenderer,
} from "../renderers";
import {
  resolveConsoleActions,
  type ConsoleContextMenuAction,
  type ConsoleMessageAction,
  type ConsolePanelAction,
  type ConsoleSurfaceActionContext,
} from "../actions";
import { writeClipboardText } from "../utils/browser/clipboard";
import type { ConsoleLinkProvider } from "../links";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleExtensionRegistry,
} from "../addons";
import { useConsoleAddons } from "../hooks/useConsoleAddons";
import {
  createConsoleViewportController,
  type ConsoleScrollOptions,
  type ConsoleViewportController,
} from "../viewport";

/** Rendering mode selected by the top-level console component. */
export type ConsoleMode = ConsoleModeType;
/** CSS resize direction supported by the console shell. */
export type ConsoleResizeDirection =
  "vertical" | "horizontal" | "both" | "block" | "inline";

/** Supported imperative surface exposed through the top-level Console ref. */
export interface ConsoleHandle {
  scrollToTop(): void;
  scrollToBottom(): void;
  scrollToMessage(id: string, options?: ConsoleScrollOptions): boolean;
  isAtBottom(): boolean;
  isAtTop(): boolean;
  focus(): void;
}

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
  /** Imperative navigation ref for the mounted console viewport. */
  ref?: Ref<ConsoleHandle | null>;
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
  /** Typed actions rendered in the header actions popover. */
  panelActions?: readonly ConsolePanelAction[];
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
  /** Custom renderers that can replace the complete inner output surface. */
  outputRenderers?: readonly ConsoleOutputRenderer[];
  /** Custom renderers for values displayed by either console mode. */
  valueRenderers?: readonly ConsoleValueRenderer[];
  /** Whether built-in HTTP/HTTPS link detection is enabled. @default true */
  detectLinks?: boolean;
  /** Ordered application-specific link providers used in either mode. */
  linkProviders?: readonly ConsoleLinkProvider[];
  /** Addons activated for this mounted console. */
  addons?: readonly ConsoleAddon[];
  /** IDs of supplied addons to keep unloaded. */
  disabledAddonIds?: readonly string[];
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
  surfaceRef: RefObject<HTMLDivElement | null>;
  viewport: ConsoleViewportController;
  hasMessages: boolean;
  isEmpty: boolean;
  scrollKey: unknown;
  children: ReactNode;
  messageActions?: readonly ConsoleMessageAction[];
}

const EMPTY_MESSAGES: ConsoleMessageData[] = [];
const EMPTY_ANSI_MESSAGES: readonly (ConsoleStdoutEntry | string)[] = [];
interface ConsoleResolvedAddonProps {
  addonExtensions: ConsoleExtensionRegistry;
  surfaceRef: RefObject<HTMLDivElement | null>;
  viewport: ConsoleViewportController;
}

function mergeContributions<T>(
  direct: readonly T[] | undefined,
  addon: readonly T[],
): readonly T[] | undefined {
  if (!direct?.length) return addon.length ? addon : undefined;
  if (!addon.length) return direct;
  return [...direct, ...addon];
}

/**
 * Shared frame that renders panel chrome, actions, context-menu support, and
 * the scrollable output surface for both console modes.
 */
function ConsoleFrame({
  mode,
  surfaceRef,
  viewport,
  onClear,
  autoScroll = true,
  resizable,
  showHeader = true,
  showClearButton = true,
  actions,
  panelActions,
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
  const actionsPopoverId = useId();
  const clear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const copyOutput = useCallback(() => {
    const value = surfaceRef.current?.innerText.trim() ?? "";

    if (value) {
      void writeClipboardText(value);
    }
  }, [surfaceRef]);

  useEffect(() => {
    if (!autoScroll) return;

    viewport.scrollToBottomIfPinned();
  }, [autoScroll, scrollKey, viewport]);

  const panelActionContext = useMemo<ConsoleSurfaceActionContext>(
    () => ({
      kind: "console",
      mode,
      hasMessages,
    }),
    [hasMessages, mode],
  );
  const resolvedPanelActions = useMemo(
    () => resolveConsoleActions(panelActions, panelActionContext),
    [panelActionContext, panelActions],
  );
  const showCopyButton = mode === "ansi";
  const showActions =
    actions ||
    resolvedPanelActions.length > 0 ||
    showCopyButton ||
    (showClearButton && onClear);

  return (
    <article
      className={`console console-panel ${className}`.trim()}
      style={style}
      data-console-mode={mode}
      data-resizable={resizable}
    >
      {showHeader && (
        <div className="console-panel-header">
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
                  <div className="console-actions">
                    {actions}

                    {resolvedPanelActions.map(({ action, disabled }) => (
                      <div
                        className="console-panel-action-entry"
                        key={action.id}
                      >
                        {action.separatorBefore && (
                          <div
                            className="console-panel-action-separator"
                            role="separator"
                          />
                        )}
                        <button
                          type="button"
                          className={
                            action.variant === "danger"
                              ? "console-panel-action console-panel-action-danger"
                              : "console-panel-action"
                          }
                          aria-label={action.ariaLabel}
                          disabled={disabled}
                          onClick={() => {
                            void action.onSelect(panelActionContext);
                          }}
                        >
                          {action.icon && (
                            <span className="console-panel-action-icon">
                              {action.icon}
                            </span>
                          )}
                          <span>{action.label}</span>
                        </button>
                      </div>
                    ))}

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
          tabIndex={-1}
          onScroll={viewport.updateFromScroll}
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
            <>
              {children}
              <div
                className="console-scroll-end-spacer"
                aria-hidden="true"
              />
            </>
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
  panelActions,
  contextMenuActions,
  outputRenderers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
  addonExtensions,
  subtitle = "Runtime output from console.*()",
  emptyMessage = "No console output yet.",
  ...frameProps
}: ConsoleMessageModeProps & ConsoleResolvedAddonProps) {
  const resolvedMessageRenderers = mergeContributions(
    messageRenderers,
    addonExtensions.getAll(consoleExtensionPoints.messageRenderer),
  );
  const resolvedMessageActions = mergeContributions(
    messageActions,
    addonExtensions.getAll(consoleExtensionPoints.messageAction),
  );
  const resolvedPanelActions = mergeContributions(
    panelActions,
    addonExtensions.getAll(consoleExtensionPoints.panelAction),
  );
  const resolvedContextMenuActions = mergeContributions(
    contextMenuActions,
    addonExtensions.getAll(consoleExtensionPoints.contextMenuAction),
  );
  const resolvedOutputRenderers = mergeContributions(
    outputRenderers,
    addonExtensions.getAll(consoleExtensionPoints.outputRenderer),
  );
  const resolvedValueRenderers = mergeContributions(
    valueRenderers,
    addonExtensions.getAll(consoleExtensionPoints.valueRenderer),
  );
  const resolvedLinkProviders = mergeContributions(
    linkProviders,
    addonExtensions.getAll(consoleExtensionPoints.linkProvider),
  );
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

  const renderDefaultOutput = () =>
    visibleMessages.map((message, index) => (
      <div
        key={
          message.id ??
          `${message.method}-${message.timestamp ?? "na"}-${index}`
        }
        data-console-message-id={message.id}
      >
        <ConsoleMessage
          message={message}
          index={index}
          messages={visibleMessages}
          expandAllVersion={expandedMessages.get(message)}
          onExpandAll={hasExpandableValues ? expandAllCollapsed : undefined}
          renderers={resolvedMessageRenderers}
          valueRenderers={resolvedValueRenderers}
          detectLinks={detectLinks}
          linkProviders={resolvedLinkProviders}
        />
      </div>
    ));
  const renderedOutput = dispatchOutputRenderer(resolvedOutputRenderers, {
    mode: "console",
    messages: visibleMessages,
    renderDefault: renderDefaultOutput,
  });
  const hasCustomOutput = renderedOutput !== undefined;

  return (
    <ConsoleFrame
      {...frameProps}
      mode="console"
      subtitle={subtitle}
      emptyMessage={emptyMessage}
      hasMessages={messages.length > 0}
      isEmpty={visibleMessages.length === 0 && !hasCustomOutput}
      scrollKey={visibleMessages}
      panelActions={resolvedPanelActions}
      contextMenuActions={resolvedContextMenuActions}
      messageActions={resolvedMessageActions}
    >
      {hasCustomOutput ? renderedOutput : renderDefaultOutput()}
    </ConsoleFrame>
  );
}

/** Renders ANSI-aware process output with optional structured parsing. */
function ConsoleAnsiMode({
  messages = EMPTY_ANSI_MESSAGES,
  parseStructuredOutput = false,
  processors,
  structuredOutputParsers,
  panelActions,
  contextMenuActions,
  outputRenderers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
  addonExtensions,
  subtitle = "ANSI-aware process output",
  emptyMessage = "No process output yet.",
  ...frameProps
}: ConsoleAnsiModeProps & ConsoleResolvedAddonProps) {
  const resolvedProcessors = mergeContributions(
    processors,
    addonExtensions.getAll(consoleExtensionPoints.processOutputProcessor),
  );
  const resolvedStructuredOutputParsers = mergeContributions(
    structuredOutputParsers,
    addonExtensions.getAll(consoleExtensionPoints.structuredOutputParser),
  );
  const resolvedPanelActions = mergeContributions(
    panelActions,
    addonExtensions.getAll(consoleExtensionPoints.panelAction),
  );
  const resolvedContextMenuActions = mergeContributions(
    contextMenuActions,
    addonExtensions.getAll(consoleExtensionPoints.contextMenuAction),
  );
  const resolvedOutputRenderers = mergeContributions(
    outputRenderers,
    addonExtensions.getAll(consoleExtensionPoints.outputRenderer),
  );
  const resolvedValueRenderers = mergeContributions(
    valueRenderers,
    addonExtensions.getAll(consoleExtensionPoints.valueRenderer),
  );
  const resolvedLinkProviders = mergeContributions(
    linkProviders,
    addonExtensions.getAll(consoleExtensionPoints.linkProvider),
  );
  const renderDefaultOutput = () => (
    <ConsoleStdout
      entries={messages}
      parseStructuredOutput={parseStructuredOutput}
      processors={resolvedProcessors}
      structuredOutputParsers={resolvedStructuredOutputParsers}
      valueRenderers={resolvedValueRenderers}
      detectLinks={detectLinks}
      linkProviders={resolvedLinkProviders}
    />
  );
  const renderedOutput = dispatchOutputRenderer(resolvedOutputRenderers, {
    mode: "ansi",
    entries: messages,
    renderDefault: renderDefaultOutput,
  });
  const hasCustomOutput = renderedOutput !== undefined;

  return (
    <ConsoleFrame
      {...frameProps}
      mode="ansi"
      subtitle={subtitle}
      emptyMessage={emptyMessage}
      hasMessages={messages.length > 0}
      isEmpty={messages.length === 0 && !hasCustomOutput}
      scrollKey={messages}
      panelActions={resolvedPanelActions}
      contextMenuActions={resolvedContextMenuActions}
    >
      {hasCustomOutput ? renderedOutput : renderDefaultOutput()}
    </ConsoleFrame>
  );
}

/**
 * Renders either structured browser-console output or ANSI process output.
 *
 * Set `mode="ansi"` for terminal-style entries; omit `mode` (or use
 * `"console"`) for structured {@link ConsoleMessageData} messages.
 */
export function Console({ ref, ...props }: ConsoleProps) {
  const mode: ConsoleMode = props.mode === "ansi" ? "ansi" : "console";
  const surfaceRef = useRef<HTMLDivElement>(null);
  const viewport = useMemo(
    () => createConsoleViewportController(() => surfaceRef.current),
    [],
  );

  useImperativeHandle(ref, () => viewport, [viewport]);

  const addonExtensions = useConsoleAddons(
    props.addons,
    props.disabledAddonIds,
    mode,
    viewport,
  );
  const resolvedProps = { addonExtensions, surfaceRef, viewport };

  if (props.mode === "ansi") {
    return <ConsoleAnsiMode {...props} {...resolvedProps} />;
  }

  return <ConsoleMessageMode {...props} {...resolvedProps} />;
}
