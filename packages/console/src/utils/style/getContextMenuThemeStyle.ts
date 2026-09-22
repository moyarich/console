import { CONTEXT_MENU_THEME_PROPERTIES } from "./constants";
import type { ContextMenuThemeStyle } from "./types";

/**
 * Reads console context-menu theme variables from an element.
 *
 * The returned inline style can be applied to a context menu after it is
 * portaled outside the themed console subtree.
 *
 * @param element Console element whose computed custom properties should be copied.
 * @returns Inline style containing non-empty console context-menu theme properties.
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
