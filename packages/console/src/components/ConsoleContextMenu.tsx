import { Braces, Copy, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  resolveConsoleActions,
  type ConsoleContextMenuAction,
  type ConsoleContextMenuActionContext,
  type ConsoleMessageAction,
  type ConsoleMessageActionContext,
  type ResolvedConsoleAction,
} from "../actions";
import { ConsoleContextMenuContext } from "../context/ConsoleContextMenuContext";
import type { ConsoleMessageData, ConsoleMode } from "../types";
import { formatConsoleObjectForCopy } from "../utils/console/copyObject";
import { writeClipboardText } from "../utils/clipboard";
import {
  getContextMenuThemeStyle,
  getEventPoint,
  getMenuPosition,
  type ContextMenuThemeStyle,
} from "../utils/console/contextMenu";

/** Props for the console's built-in right-click action surface. */
export interface ConsoleContextMenuProps {
  /** Console surface wrapped by the context-menu provider. */
  children: ReactNode;
  /** Current console rendering mode. */
  mode: ConsoleMode;
  /** Whether the console currently contains any source messages. */
  hasMessages: boolean;
  /** Host-defined actions available for console/object/message targets. */
  actions?: readonly ConsoleContextMenuAction[];
  /** Host-defined actions available only for message targets. */
  messageActions?: readonly ConsoleMessageAction[];
  /** Whether the built-in copy-console command is disabled. */
  copyDisabled?: boolean;
  /** Whether the built-in clear command is disabled. */
  clearDisabled?: boolean;
  /** Invoked by the built-in clear command. */
  onClear?: () => void;
}

type MenuTarget =
  | { kind: "console" }
  | { kind: "object"; value: object }
  | {
      kind: "message";
      message: ConsoleMessageData;
      index: number;
      messages: readonly ConsoleMessageData[];
    };

interface MenuState {
  x: number;
  y: number;
  target: MenuTarget;
  themeStyle: ContextMenuThemeStyle;
}

interface ConsoleActionMenuItemProps<TContext> {
  resolvedAction: ResolvedConsoleAction<TContext>;
  context: TContext;
  onBeforeSelect: () => void;
}

function ConsoleActionMenuItem<TContext>({
  resolvedAction,
  context,
  onBeforeSelect,
}: ConsoleActionMenuItemProps<TContext>) {
  const { action, disabled } = resolvedAction;
  const className = [
    "console-context-menu-item",
    action.variant === "danger" ? "console-context-menu-item-danger" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {action.separatorBefore && (
        <div className="console-context-menu-separator" role="separator" />
      )}
      <button
        type="button"
        className={className}
        role="menuitem"
        aria-label={action.ariaLabel}
        disabled={disabled}
        onClick={() => {
          onBeforeSelect();
          void action.onSelect(context);
        }}
      >
        {action.icon && (
          <span className="console-context-menu-action-icon">
            {action.icon}
          </span>
        )}
        <span>{action.label}</span>
      </button>
    </>
  );
}

/**
 * Provides object/message context-menu APIs to descendants and renders the
 * accessible menu portal with built-in and host-defined actions.
 */
export function ConsoleContextMenu({
  children,
  mode,
  hasMessages,
  actions,
  messageActions,
  copyDisabled = false,
  clearDisabled = false,
  onClear,
}: ConsoleContextMenuProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback(
    (event: MouseEvent<HTMLElement>, target: MenuTarget) => {
      const point = getEventPoint(event);
      const themeStyle = getContextMenuThemeStyle(targetRef.current);
      setMenu({ ...point, target, themeStyle });
    },
    [],
  );

  const openForValue = useCallback(
    (event: MouseEvent<HTMLElement>, value: object) => {
      event.preventDefault();
      event.stopPropagation();
      openMenu(event, { kind: "object", value });
    },
    [openMenu],
  );

  const openForMessage = useCallback(
    (
      event: MouseEvent<HTMLElement>,
      message: ConsoleMessageData,
      index: number,
      messages: readonly ConsoleMessageData[],
    ) => {
      event.preventDefault();
      event.stopPropagation();
      openMenu(event, { kind: "message", message, index, messages });
    },
    [openMenu],
  );

  const copyObject = useCallback(
    (value: object) => {
      closeMenu();
      void writeClipboardText(formatConsoleObjectForCopy(value));
    },
    [closeMenu],
  );

  const messageContextEnabled = Boolean(
    actions?.length || messageActions?.length,
  );

  const contextValue = useMemo(
    () => ({
      copyObject,
      openForValue,
      openForMessage,
      messageContextEnabled,
    }),
    [copyObject, messageContextEnabled, openForMessage, openForValue],
  );

  const actionContext = useMemo<ConsoleContextMenuActionContext | null>(() => {
    if (!menu) {
      return null;
    }

    const base = { mode, hasMessages };

    if (menu.target.kind === "object") {
      return { ...base, kind: "object", value: menu.target.value };
    }

    if (menu.target.kind === "message") {
      return {
        ...base,
        kind: "message",
        message: menu.target.message,
        index: menu.target.index,
        messages: menu.target.messages,
      };
    }

    return { ...base, kind: "console" };
  }, [hasMessages, menu, mode]);

  const resolvedContextActions = useMemo(
    () => (actionContext ? resolveConsoleActions(actions, actionContext) : []),
    [actionContext, actions],
  );

  const messageActionContext: ConsoleMessageActionContext | null =
    actionContext?.kind === "message" ? actionContext : null;

  const resolvedMessageActions = useMemo(
    () =>
      messageActionContext
        ? resolveConsoleActions(messageActions, messageActionContext)
        : [],
    [messageActionContext, messageActions],
  );

  useEffect(() => {
    if (!menu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    const handleViewportChange = () => closeMenu();
    const animationFrame = requestAnimationFrame(() => {
      const menuElement = menuRef.current;

      if (!menuElement) {
        return;
      }

      const rect = menuElement.getBoundingClientRect();
      const position = getMenuPosition(menu.x, menu.y, rect.width, rect.height);
      menuElement.style.left = `${position.x}px`;
      menuElement.style.top = `${position.y}px`;
      const firstAction = menuElement.querySelector<HTMLButtonElement>(
        ".console-context-menu-item:not(:disabled)",
      );

      if (firstAction) {
        firstAction.focus();
      } else {
        menuElement.focus();
      }
    });

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [closeMenu, menu]);

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openMenu(event, { kind: "console" });
  };

  const handleCopyConsole = () => {
    const value = targetRef.current?.innerText.trim() ?? "";
    closeMenu();

    if (value) {
      void writeClipboardText(value);
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    const actionButtons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        ".console-context-menu-item:not(:disabled)",
      ) ?? [],
    );

    if (!actionButtons.length) {
      return;
    }

    const currentIndex = actionButtons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    let nextIndex = 0;

    if (event.key === "End") {
      nextIndex = actionButtons.length - 1;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        currentIndex <= 0 ? actionButtons.length - 1 : currentIndex - 1;
    } else if (event.key === "ArrowDown") {
      nextIndex =
        currentIndex < 0 || currentIndex === actionButtons.length - 1
          ? 0
          : currentIndex + 1;
    }

    event.preventDefault();
    actionButtons[nextIndex]?.focus();
  };

  const hasCustomActions =
    resolvedContextActions.length > 0 || resolvedMessageActions.length > 0;

  return (
    <ConsoleContextMenuContext.Provider value={contextValue}>
      <div
        ref={targetRef}
        className="console-context-menu-target"
        onContextMenu={handleContextMenu}
      >
        {children}
      </div>

      {menu &&
        actionContext &&
        createPortal(
          <div
            ref={menuRef}
            className="console-context-menu"
            role="menu"
            aria-label="Console actions"
            tabIndex={-1}
            style={{
              left: menu.x,
              top: menu.y,
              ...menu.themeStyle,
            }}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={handleMenuKeyDown}
          >
            {resolvedContextActions.map((resolvedAction) => (
              <ConsoleActionMenuItem
                key={`context-${resolvedAction.action.id}`}
                resolvedAction={resolvedAction}
                context={actionContext}
                onBeforeSelect={closeMenu}
              />
            ))}

            {messageActionContext &&
              resolvedMessageActions.map((resolvedAction) => (
                <ConsoleActionMenuItem
                  key={`message-${resolvedAction.action.id}`}
                  resolvedAction={resolvedAction}
                  context={messageActionContext}
                  onBeforeSelect={closeMenu}
                />
              ))}

            {hasCustomActions && (
              <div
                className="console-context-menu-separator"
                role="separator"
              />
            )}

            {menu.target.kind === "object" && (
              <button
                type="button"
                className="console-context-menu-item"
                role="menuitem"
                onClick={() => {
                  if (menu.target.kind === "object") {
                    copyObject(menu.target.value);
                  }
                }}
              >
                <Braces size={15} aria-hidden="true" />
                <span>Copy object</span>
              </button>
            )}

            <button
              type="button"
              className="console-context-menu-item"
              role="menuitem"
              disabled={copyDisabled}
              onClick={handleCopyConsole}
            >
              <Copy size={15} aria-hidden="true" />
              <span>Copy console output</span>
            </button>

            <div className="console-context-menu-separator" role="separator" />

            <button
              type="button"
              className="console-context-menu-item console-context-menu-item-danger"
              role="menuitem"
              disabled={clearDisabled}
              onClick={() => {
                closeMenu();
                onClear?.();
              }}
            >
              <Trash2 size={15} aria-hidden="true" />
              <span>Clear console</span>
            </button>
          </div>,
          document.body,
        )}
    </ConsoleContextMenuContext.Provider>
  );
}
