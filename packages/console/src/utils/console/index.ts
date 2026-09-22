/**
 * Structured-console utility modules.
 *
 * These helpers are available through the secondary package entry point
 * `@moyarich/console/utils/console` without expanding the main package API.
 */
export {
  CONTEXT_MENU_THEME_PROPERTIES,
  CONTEXT_MENU_VIEWPORT_MARGIN,
} from "./constants";
export { collectColumns } from "./collectColumns";
export { formatConsoleObjectForCopy } from "./formatConsoleObjectForCopy";
export { getContextMenuThemeStyle } from "./getContextMenuThemeStyle";
export { getEventPoint } from "./getEventPoint";
export { getMenuPosition } from "./getMenuPosition";
export { isElementLike } from "./isElementLike";
export { isInspectableObject } from "./isInspectableObject";
export { isMapLike } from "./isMapLike";
export { isObjectLike } from "./isObjectLike";
export { isRecord } from "./isRecord";
export { isSetLike } from "./isSetLike";
export { normalizeConsoleTableData } from "./normalizeConsoleTableData";
export { normalizeConsoleValue } from "./normalizeConsoleValue";
export { objectEntries } from "./objectEntries";
export { objectLabel } from "./objectLabel";
export { preview } from "./preview";
export { toRows } from "./toRows";
export { typeClass } from "./typeClass";
export type {
  ConsoleTableRow,
  ContextMenuThemeProperty,
  ContextMenuThemeStyle,
} from "./types";
