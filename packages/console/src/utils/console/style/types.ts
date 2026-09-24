import type { CSSProperties } from "react";

/** Public CSS-variable keys copied from a console surface into its context-menu portal. */
export type ContextMenuThemeProperty =
  | "--console-color-scheme"
  | "--console-scrollbar-width"
  | "--console-scrollbar-color"
  | "--console-context-menu-color-scheme"
  | "--console-context-menu-scrollbar-width"
  | "--console-context-menu-scrollbar-color"
  | "--console-context-menu-background-color"
  | "--console-context-menu-border"
  | "--console-context-menu-color"
  | "--console-context-menu-muted-color"
  | "--console-context-menu-hover-background-color"
  | "--console-context-menu-hover-color"
  | "--console-context-menu-icon-color"
  | "--console-context-menu-danger-color"
  | "--console-context-menu-border-radius"
  | "--console-context-menu-box-shadow"
  | "--console-context-menu-separator-background-color";

/** Inline style used to preserve console theme variables on a portaled context menu. */
export type ContextMenuThemeStyle = CSSProperties &
  Partial<Record<ContextMenuThemeProperty, string>>;
