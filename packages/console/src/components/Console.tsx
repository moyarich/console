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
  ConsoleResolvedStdout,
  type ConsoleProcessControlParser,
  type ConsoleProcessOutputProcessor,
  type ConsoleStdoutEntry,
  type ConsoleStructuredOutputParser,
} from "./ConsoleStdout";
import { resolveConsoleProcessOutput } from "../processOutput";
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
  type ConsoleEmptyStateRenderer,
  type ConsoleEmptyStateRendererContext,
  type ConsoleExtensionRegistry,
  type ConsoleFrameDecorator,
  type ConsoleKeyboardShortcut,
  type ConsoleKeyboardShortcutContext,
  type ConsoleMessageDecoration,
  type ConsoleMessageDecorationPlacement,
  type ConsoleMessageFilter as CoreConsoleMessageFilter,
  type ConsoleMessageFilterContext,
  type ConsolePanelElement,
  type ConsolePanelElementContext,
  type ConsolePanelElementPlacement,
} from "../addons";
import { useConsoleAddons } from "../hooks/useConsoleAddons";
import {
  createConsoleDataController,
  type ConsoleDataController,
} from "../data";
import {
  createConsoleViewportController,
  type ConsoleScrollOptions,
  type ConsoleViewportController,
} from "../viewport";

/** Rendering mode selected by the top-level console component. */
export type ConsoleMode = ConsoleModeType;

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
export type ConsoleMessageFilter = CoreConsoleMessageFilter;

/** Props shared by structured and ANSI console modes. */
interface ConsoleSharedProps {
  /** Imperative navigation ref for the mounted console viewport. */
  ref?: Ref<ConsoleHandle | null>;
  /** Called by the built-in clear action. Omit to disable clear behavior. */
  onClear?: () => void;
  /** Keep the output pinned to the bottom while the user remains near it. @default true */
  autoScroll?: boolean;
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
  /** Ordered raw control parsers applied before line normalization. */
  processControlParsers?: readonly ConsoleProcessControlParser[];
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
  frameDecorators?: readonly ConsoleFrameDecorator<ReactNode>[];
  panelElements?: readonly ConsolePanelElement<ReactNode>[];
  emptyStateRenderers?: readonly ConsoleEmptyStateRenderer<ReactNode>[];
  keyboardShortcuts?: readonly ConsoleKeyboardShortcut[];
}

const EMPTY_MESSAGES: ConsoleMessageData[] = [];
const EMPTY_ANSI_MESSAGES: readonly (ConsoleStdoutEntry | string)[] = [];
interface ConsoleResolvedAddonProps {
  addonExtensions: ConsoleExtensionRegistry;
  data: ConsoleDataController;
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

function renderConsoleFrameDecorators(
  decorators: readonly ConsoleFrameDecorator<ReactNode>[] | undefined,
  mode: ConsoleMode,
  renderDefault: () => ReactNode,
): ReactNode {
  let render = renderDefault;

  for (const decorator of [...(decorators ?? [])].reverse()) {
    const renderNext = render;
    render = () =>
      decorator.render({
        mode,
        renderDefault: renderNext,
      }) ?? renderNext();
  }

  return render();
}

function renderConsolePanelElements(
  elements: readonly ConsolePanelElement<ReactNode>[] | undefined,
  placement: ConsolePanelElementPlacement,
  context: ConsolePanelElementContext,
): ReactNode {
  const rendered: ReactNode[] = [];

  for (const element of elements ?? []) {
    if (element.placement !== placement) continue;

    try {
      const value = element.render(context);

      if (value !== undefined) {
        rendered.push(
          <div
            key={element.id}
            className="console-panel-element"
            data-console-panel-element={element.id}
          >
            {value}
          </div>,
        );
      }
    } catch {
      // One addon-owned panel element must not break the console frame.
    }
  }

  if (rendered.length === 0) return null;

  return (
    <div
      className={`console-panel-elements console-panel-elements-${placement}`}
      data-console-panel-placement={placement}
    >
      {rendered}
    </div>
  );
}

function renderConsoleMessageDecorations(
  decorations: readonly ConsoleMessageDecoration<ReactNode>[],
  placement: ConsoleMessageDecorationPlacement,
  message: ConsoleMessageData,
  index: number,
  messages: readonly ConsoleMessageData[],
): ReactNode {
  const rendered: ReactNode[] = [];
  const context = { message, index, messages, placement };

  for (const decoration of decorations) {
    if (decoration.placement !== placement) continue;

    try {
      if (decoration.match && !decoration.match(context)) continue;
      const value = decoration.render(context);

      if (value !== undefined) {
        rendered.push(
          <div
            key={decoration.id}
            className="console-message-decoration"
            data-console-message-decoration={decoration.id}
          >
            {value}
          </div>,
        );
      }
    } catch {
      // One addon-owned decoration must not break message rendering.
    }
  }

  if (rendered.length === 0) return null;

  return (
    <div
      className={`console-message-decorations console-message-decorations-${placement}`}
      data-console-message-decoration-placement={placement}
    >
      {rendered}
    </div>
  );
}

function renderConsoleEmptyState(
  renderers: readonly ConsoleEmptyStateRenderer<ReactNode>[] | undefined,
  context: ConsoleEmptyStateRendererContext<ReactNode>,
): ReactNode {
  for (const renderer of renderers ?? []) {
    try {
      if (renderer.mode && renderer.mode !== context.mode) continue;
      if (renderer.match && !renderer.match(context)) continue;

      const rendered = renderer.render(context);
      if (rendered !== undefined) return rendered;
    } catch {
      // One addon-owned empty-state renderer must not break the console.
    }
  }

  return context.renderDefault();
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.matches("input, textarea, select, [contenteditable='true']")
  );
}

function matchesConsoleKeyboardShortcut(
  shortcut: ConsoleKeyboardShortcut,
  event: React.KeyboardEvent<HTMLElement>,
): boolean {
  return (
    event.key.toLocaleLowerCase() === shortcut.key.toLocaleLowerCase() &&
    event.altKey === Boolean(shortcut.altKey) &&
    event.ctrlKey === Boolean(shortcut.ctrlKey) &&
    event.metaKey === Boolean(shortcut.metaKey) &&
    event.shiftKey === Boolean(shortcut.shiftKey)
  );
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
  frameDecorators,
  panelElements,
  emptyStateRenderers,
  keyboardShortcuts,
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
  const panelElementContext = useMemo<ConsolePanelElementContext>(
    () => ({ mode, hasMessages, isEmpty }),
    [hasMessages, isEmpty, mode],
  );
  const keyboardShortcutContext = useMemo<ConsoleKeyboardShortcutContext>(
    () => ({ mode, hasMessages, isEmpty }),
    [hasMessages, isEmpty, mode],
  );
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      for (const shortcut of keyboardShortcuts ?? []) {
        if (
          !shortcut.allowInEditable &&
          isEditableKeyboardTarget(event.target)
        ) {
          continue;
        }
        if (!matchesConsoleKeyboardShortcut(shortcut, event)) continue;
        if (shortcut.when && !shortcut.when(keyboardShortcutContext)) continue;

        if (shortcut.preventDefault !== false) event.preventDefault();
        if (shortcut.stopPropagation) event.stopPropagation();
        void shortcut.onTrigger(keyboardShortcutContext);
        break;
      }
    },
    [keyboardShortcutContext, keyboardShortcuts],
  );
  const showCopyButton = mode === "ansi";
  const showActions =
    actions ||
    resolvedPanelActions.length > 0 ||
    showCopyButton ||
    (showClearButton && onClear);

  const renderDefaultFrame = () => (
    <article
      className={`console console-panel ${className}`.trim()}
      style={style}
      data-console-mode={mode}
      tabIndex={keyboardShortcuts?.length ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {showHeader && (
        <div className="console-panel-header">
          <div className="console-panel-header-main">
            {renderConsolePanelElements(
              panelElements,
              "header-start",
              panelElementContext,
            )}
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

            {renderConsolePanelElements(
              panelElements,
              "header-end",
              panelElementContext,
            )}

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

      {renderConsolePanelElements(
        panelElements,
        "before-output",
        panelElementContext,
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
            renderConsoleEmptyState(emptyStateRenderers, {
              mode,
              hasMessages,
              message: emptyMessage ?? "",
              renderDefault: () => (
                <div className="console-empty">
                  <SquareTerminal
                    className="console-empty-icon"
                    size={28}
                    aria-hidden="true"
                  />
                  <span>{emptyMessage}</span>
                </div>
              ),
            })
          ) : (
            <>
              {children}
              <div className="console-scroll-end-spacer" aria-hidden="true" />
            </>
          )}
        </div>
      </ConsoleContextMenu>

      {renderConsolePanelElements(
        panelElements,
        "after-output",
        panelElementContext,
      )}
      {renderConsolePanelElements(panelElements, "footer", panelElementContext)}
    </article>
  );

  return renderConsoleFrameDecorators(
    frameDecorators,
    mode,
    renderDefaultFrame,
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
  data,
  subtitle = "Runtime output from console.*()",
  emptyMessage = "No console output yet.",
  ...frameProps
}: ConsoleMessageModeProps & ConsoleResolvedAddonProps) {
  const resolvedMessageRenderers = mergeContributions(
    messageRenderers,
    addonExtensions.getAll(
      consoleExtensionPoints.messageRenderer,
    ) as readonly ConsoleMessageRenderer[],
  );
  const resolvedMessageActions = mergeContributions(
    messageActions,
    addonExtensions.getAll(
      consoleExtensionPoints.messageAction,
    ) as readonly ConsoleMessageAction[],
  );
  const resolvedPanelActions = mergeContributions(
    panelActions,
    addonExtensions.getAll(
      consoleExtensionPoints.panelAction,
    ) as readonly ConsolePanelAction[],
  );
  const resolvedContextMenuActions = mergeContributions(
    contextMenuActions,
    addonExtensions.getAll(
      consoleExtensionPoints.contextMenuAction,
    ) as readonly ConsoleContextMenuAction[],
  );
  const resolvedOutputRenderers = mergeContributions(
    outputRenderers,
    addonExtensions.getAll(
      consoleExtensionPoints.outputRenderer,
    ) as readonly ConsoleOutputRenderer[],
  );
  const resolvedValueRenderers = mergeContributions(
    valueRenderers,
    addonExtensions.getAll(
      consoleExtensionPoints.valueRenderer,
    ) as readonly ConsoleValueRenderer[],
  );
  const resolvedLinkProviders = mergeContributions(
    linkProviders,
    addonExtensions.getAll(consoleExtensionPoints.linkProvider),
  );
  const resolvedFrameDecorators = addonExtensions.getAll(
    consoleExtensionPoints.frameDecorator,
  ) as readonly ConsoleFrameDecorator<ReactNode>[];
  const resolvedPanelElements = addonExtensions.getAll(
    consoleExtensionPoints.panelElement,
  ) as readonly ConsolePanelElement<ReactNode>[];
  const resolvedEmptyStateRenderers = addonExtensions.getAll(
    consoleExtensionPoints.emptyStateRenderer,
  ) as readonly ConsoleEmptyStateRenderer<ReactNode>[];
  const resolvedKeyboardShortcuts = addonExtensions.getAll(
    consoleExtensionPoints.keyboardShortcut,
  ) as readonly ConsoleKeyboardShortcut[];
  const resolvedMessageDecorations = addonExtensions.getAll(
    consoleExtensionPoints.messageDecoration,
  ) as readonly ConsoleMessageDecoration<ReactNode>[];
  const addonMessageFilters = addonExtensions.getAll(
    consoleExtensionPoints.messageFilter,
  ) as readonly CoreConsoleMessageFilter[];
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
      filter || addonMessageFilters.length > 0
        ? messages.filter((message, index) => {
            const context: ConsoleMessageFilterContext = {
              message,
              index,
              messages,
            };

            return (
              (!filter || filter(context)) &&
              addonMessageFilters.every((addonFilter) => addonFilter(context))
            );
          })
        : messages,
    [addonMessageFilters, filter, messages],
  );

  useEffect(() => {
    data.setSnapshot({
      mode: "console",
      all: messages,
      visible: visibleMessages,
    });
  }, [data, messages, visibleMessages]);

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
    visibleMessages.map((message, index) => {
      const key =
        message.id ?? `${message.method}-${message.timestamp ?? "na"}-${index}`;
      const gutter = renderConsoleMessageDecorations(
        resolvedMessageDecorations,
        "gutter",
        message,
        index,
        visibleMessages,
      );
      const before = renderConsoleMessageDecorations(
        resolvedMessageDecorations,
        "before",
        message,
        index,
        visibleMessages,
      );
      const after = renderConsoleMessageDecorations(
        resolvedMessageDecorations,
        "after",
        message,
        index,
        visibleMessages,
      );
      const badge = renderConsoleMessageDecorations(
        resolvedMessageDecorations,
        "badge",
        message,
        index,
        visibleMessages,
      );
      const overlay = renderConsoleMessageDecorations(
        resolvedMessageDecorations,
        "overlay",
        message,
        index,
        visibleMessages,
      );
      const hasDecorations = Boolean(
        gutter || before || after || badge || overlay,
      );

      const renderedMessage = (
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
      );

      if (!hasDecorations) {
        return (
          <div key={key} data-console-message-id={message.id}>
            {renderedMessage}
          </div>
        );
      }

      return (
        <div
          key={key}
          className="console-message-extension-shell"
          data-console-message-id={message.id}
        >
          {before}
          <div className="console-message-extension-row">
            {gutter}
            <div className="console-message-extension-content">
              {renderedMessage}
            </div>
            {badge}
          </div>
          {after}
          {overlay}
        </div>
      );
    });
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
      frameDecorators={resolvedFrameDecorators}
      panelElements={resolvedPanelElements}
      emptyStateRenderers={resolvedEmptyStateRenderers}
      keyboardShortcuts={resolvedKeyboardShortcuts}
    >
      {hasCustomOutput ? renderedOutput : renderDefaultOutput()}
    </ConsoleFrame>
  );
}

/** Renders ANSI-aware process output with optional structured parsing. */
function ConsoleAnsiMode({
  messages = EMPTY_ANSI_MESSAGES,
  parseStructuredOutput = false,
  processControlParsers,
  processors,
  structuredOutputParsers,
  panelActions,
  contextMenuActions,
  outputRenderers,
  valueRenderers,
  detectLinks = true,
  linkProviders,
  addonExtensions,
  data,
  subtitle = "ANSI-aware process output",
  emptyMessage = "No process output yet.",
  ...frameProps
}: ConsoleAnsiModeProps & ConsoleResolvedAddonProps) {
  const resolvedProcessControlParsers = mergeContributions(
    processControlParsers,
    addonExtensions.getAll(consoleExtensionPoints.processControlParser),
  );
  const resolvedProcessors = mergeContributions(
    processors,
    addonExtensions.getAll(consoleExtensionPoints.processOutputProcessor),
  );
  const resolvedStructuredOutputParsers = mergeContributions(
    structuredOutputParsers,
    addonExtensions.getAll(consoleExtensionPoints.structuredOutputParser),
  );
  const resolvedProcessOutput = useMemo(
    () =>
      resolveConsoleProcessOutput(
        messages,
        resolvedProcessors,
        resolvedProcessControlParsers,
      ),
    [messages, resolvedProcessControlParsers, resolvedProcessors],
  );
  const resolvedEntries = resolvedProcessOutput.entries;

  useEffect(() => {
    data.setSnapshot({
      mode: "ansi",
      rawEntries: messages,
      all: resolvedEntries,
      visible: resolvedEntries,
      controlEvents: resolvedProcessOutput.controlEvents,
    });
  }, [data, messages, resolvedEntries, resolvedProcessOutput.controlEvents]);
  const resolvedPanelActions = mergeContributions(
    panelActions,
    addonExtensions.getAll(
      consoleExtensionPoints.panelAction,
    ) as readonly ConsolePanelAction[],
  );
  const resolvedContextMenuActions = mergeContributions(
    contextMenuActions,
    addonExtensions.getAll(
      consoleExtensionPoints.contextMenuAction,
    ) as readonly ConsoleContextMenuAction[],
  );
  const resolvedOutputRenderers = mergeContributions(
    outputRenderers,
    addonExtensions.getAll(
      consoleExtensionPoints.outputRenderer,
    ) as readonly ConsoleOutputRenderer[],
  );
  const resolvedValueRenderers = mergeContributions(
    valueRenderers,
    addonExtensions.getAll(
      consoleExtensionPoints.valueRenderer,
    ) as readonly ConsoleValueRenderer[],
  );
  const resolvedLinkProviders = mergeContributions(
    linkProviders,
    addonExtensions.getAll(consoleExtensionPoints.linkProvider),
  );
  const resolvedFrameDecorators = addonExtensions.getAll(
    consoleExtensionPoints.frameDecorator,
  ) as readonly ConsoleFrameDecorator<ReactNode>[];
  const resolvedPanelElements = addonExtensions.getAll(
    consoleExtensionPoints.panelElement,
  ) as readonly ConsolePanelElement<ReactNode>[];
  const resolvedEmptyStateRenderers = addonExtensions.getAll(
    consoleExtensionPoints.emptyStateRenderer,
  ) as readonly ConsoleEmptyStateRenderer<ReactNode>[];
  const resolvedKeyboardShortcuts = addonExtensions.getAll(
    consoleExtensionPoints.keyboardShortcut,
  ) as readonly ConsoleKeyboardShortcut[];
  const renderDefaultOutput = () => (
    <ConsoleResolvedStdout
      resolvedEntries={resolvedEntries}
      parseStructuredOutput={parseStructuredOutput}
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
      isEmpty={resolvedEntries.length === 0 && !hasCustomOutput}
      scrollKey={resolvedEntries}
      panelActions={resolvedPanelActions}
      contextMenuActions={resolvedContextMenuActions}
      frameDecorators={resolvedFrameDecorators}
      panelElements={resolvedPanelElements}
      emptyStateRenderers={resolvedEmptyStateRenderers}
      keyboardShortcuts={resolvedKeyboardShortcuts}
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
  const data = useMemo(() => createConsoleDataController(mode), [mode]);

  useImperativeHandle(ref, () => viewport, [viewport]);

  const addonExtensions = useConsoleAddons(
    props.addons,
    props.disabledAddonIds,
    mode,
    viewport,
    data,
  );
  const resolvedProps = { addonExtensions, data, surfaceRef, viewport };

  if (props.mode === "ansi") {
    return <ConsoleAnsiMode {...props} {...resolvedProps} />;
  }

  return <ConsoleMessageMode {...props} {...resolvedProps} />;
}
