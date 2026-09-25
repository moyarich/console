const primaryModifier = process.platform === "darwin" ? "Meta" : "Control";

/**
 * Stable VS Code shortcuts used for demo navigation that should not appear in
 * recordings as Command Palette interactions.
 */
export const KEYBOARD_SHORTCUTS = Object.freeze({
  commandPalette: `${primaryModifier}+Shift+P`,
  quickOpen: `${primaryModifier}+P`,
  sourceControl: "Control+Shift+G",
  splitEditor: `${primaryModifier}+\\`,
  togglePanel: `${primaryModifier}+J`,
  toggleSecondarySidebar:
    process.platform === "darwin" ? "Alt+Meta+B" : "Control+Alt+B",
  accept: "Enter",
  closeAllEditors: Object.freeze([
    `${primaryModifier}+K`,
    `${primaryModifier}+W`,
  ]),
  openToSide: "Control+Enter",
  openInNewTab: "ArrowRight",
});
