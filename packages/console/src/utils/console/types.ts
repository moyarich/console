import type { CSSProperties } from "react";

/** Public CSS-variable keys copied from a console surface into its context-menu portal. */
export type ContextMenuThemeProperty =
  | "--console-color-scheme"
  | "--console-context-menu-color-scheme"
  | "--console-context-menu-background"
  | "--console-context-menu-border"
  | "--console-context-menu-foreground"
  | "--console-context-menu-muted"
  | "--console-context-menu-hover"
  | "--console-context-menu-hover-foreground"
  | "--console-context-menu-icon"
  | "--console-context-menu-danger"
  | "--console-context-menu-radius"
  | "--console-context-menu-shadow";

/** Inline style used to preserve console theme variables on a portaled context menu. */
export type ContextMenuThemeStyle = CSSProperties &
  Partial<Record<ContextMenuThemeProperty, string>>;
