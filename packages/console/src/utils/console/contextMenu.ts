import type { CSSProperties, MouseEvent } from "react";

const CONTEXT_MENU_THEME_PROPERTIES = [
  "--console-color-scheme",
  "--console-context-menu-color-scheme",
  "--console-context-menu-background",
  "--console-context-menu-border",
  "--console-context-menu-foreground",
  "--console-context-menu-muted",
  "--console-context-menu-hover",
  "--console-context-menu-hover-foreground",
  "--console-context-menu-icon",
  "--console-context-menu-danger",
  "--console-context-menu-radius",
  "--console-context-menu-shadow",
] as const;

type ContextMenuThemeProperty = (typeof CONTEXT_MENU_THEME_PROPERTIES)[number];

export type ContextMenuThemeStyle = CSSProperties &
  Partial<Record<ContextMenuThemeProperty, string>>;

const VIEWPORT_MARGIN = 8;

/** Clamps a context-menu position so the measured menu remains in the viewport. */
export function getMenuPosition(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
) {
  const maxX = Math.max(
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN,
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

/**
 * Reads public context-menu theme variables from the console target.
 *
 * The returned inline style preserves wrapper-scoped themes after the menu is
 * portaled to `document.body`.
 */
export function getContextMenuThemeStyle(
  element: HTMLElement | null,
): ContextMenuThemeStyle {
  if (!element || typeof window === "undefined") {
    return {};
  }

  const computedStyle = window.getComputedStyle(element);
  const themeStyle: ContextMenuThemeStyle = {};

  for (const property of CONTEXT_MENU_THEME_PROPERTIES) {
    const value = computedStyle.getPropertyValue(property).trim();

    if (value) {
      themeStyle[property] = value;
    }
  }

  return themeStyle;
}

/**
 * Returns pointer coordinates, falling back to the target bounds for keyboard-
 * initiated context-menu events whose client coordinates are zero.
 */
export function getEventPoint(event: MouseEvent<HTMLElement>) {
  if (event.clientX !== 0 || event.clientY !== 0) {
    return { x: event.clientX, y: event.clientY };
  }

  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: rect.left + Math.min(24, rect.width / 2),
    y: rect.top + Math.min(24, rect.height / 2),
  };
}
