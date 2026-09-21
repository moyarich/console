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
import { ConsoleContextMenuContext } from "../context/ConsoleContextMenuContext";
import { formatConsoleObjectForCopy } from "../utils/consoleCopyObject";
import { writeClipboardText } from "../utils/clipboard";

export interface ConsoleContextMenuProps {
  children: ReactNode;
  copyDisabled?: boolean;
  clearDisabled?: boolean;
  onClear?: () => void;
}

interface MenuState {
  x: number;
  y: number;
  value?: object;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 86;
const MENU_HEIGHT_WITH_OBJECT = 122;
const VIEWPORT_MARGIN = 8;

function getMenuPosition(clientX: number, clientY: number, height: number) {
  const maxX = Math.max(
    VIEWPORT_MARGIN,
    window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
  );
  const maxY = Math.max(
    VIEWPORT_MARGIN,
    window.innerHeight - height - VIEWPORT_MARGIN,
  );
  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, clientX), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, clientY), maxY),
  };
}

export function ConsoleContextMenu({
  children,
  copyDisabled = false,
  clearDisabled = false,
  onClear,
}: ConsoleContextMenuProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback(
    (clientX: number, clientY: number, value?: object) => {
      const height = value ? MENU_HEIGHT_WITH_OBJECT : MENU_HEIGHT;
      setMenu({ ...getMenuPosition(clientX, clientY, height), value });
    },
    [],
  );

  const openForValue = useCallback(
    (event: MouseEvent<HTMLElement>, value: object) => {
      event.preventDefault();
      event.stopPropagation();
      openMenu(event.clientX, event.clientY, value);
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

  const contextValue = useMemo(
    () => ({ copyObject, openForValue }),
    [copyObject, openForValue],
  );

  useEffect(() => {
    if (!menu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) closeMenu();
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const handleViewportChange = () => closeMenu();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    requestAnimationFrame(() => firstActionRef.current?.focus());

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [closeMenu, menu]);

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openMenu(event.clientX, event.clientY);
  };

  const handleCopyConsole = () => {
    const value = targetRef.current?.innerText.trim() ?? "";
    closeMenu();
    if (value) void writeClipboardText(value);
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const actions = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        ".console-context-menu-item:not(:disabled)",
      ) ?? [],
    );
    if (!actions.length) return;

    const currentIndex = actions.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    let nextIndex = 0;

    if (event.key === "End") nextIndex = actions.length - 1;
    else if (event.key === "ArrowUp") {
      nextIndex = currentIndex <= 0 ? actions.length - 1 : currentIndex - 1;
    } else if (event.key === "ArrowDown") {
      nextIndex =
        currentIndex < 0 || currentIndex === actions.length - 1
          ? 0
          : currentIndex + 1;
    }

    event.preventDefault();
    actions[nextIndex]?.focus();
  };

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
        createPortal(
          <div
            ref={menuRef}
            className="console-context-menu"
            role="menu"
            aria-label="Console actions"
            style={{ left: menu.x, top: menu.y }}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={handleMenuKeyDown}
          >
            {menu.value && (
              <button
                ref={firstActionRef}
                type="button"
                className="console-context-menu-item"
                role="menuitem"
                onClick={() => copyObject(menu.value!)}
              >
                <Braces size={15} aria-hidden="true" />
                <span>Copy object</span>
              </button>
            )}

            <button
              ref={menu.value ? undefined : firstActionRef}
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
