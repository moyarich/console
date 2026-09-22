import type { ContextMenuThemeProperty } from "./types";

/** Public console theme variables copied into the context-menu portal. */
export const CONTEXT_MENU_THEME_PROPERTIES: readonly ContextMenuThemeProperty[] =
  [
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
  ];

/** Minimum distance, in CSS pixels, kept between a context menu and the viewport edge. */
export const CONTEXT_MENU_VIEWPORT_MARGIN = 8;
