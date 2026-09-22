/**
 * Structured-console utility modules.
 *
 * These helpers are available through the secondary package entry point
 * `@moyarich/console/utils/console` without expanding the main package API.
 */
export { formatConsoleObjectForCopy } from "./formatConsoleObjectForCopy";
export { getEventPoint } from "./contextMenu/getEventPoint";
export { getMenuPosition } from "./contextMenu/getMenuPosition";
export { isElementLike } from "./isElementLike";
export { isInspectableObject } from "./isInspectableObject";
export { isMapLike } from "./isMapLike";
export { isObjectLike } from "./isObjectLike";
export { isRecord } from "./isRecord";
export { isSetLike } from "./isSetLike";
export { normalizeConsoleValue } from "./normalizeConsoleValue";
export { objectEntries } from "./objectEntries";
export { objectLabel } from "./objectLabel";
export { preview } from "./preview";
export { captureConsole } from "./runtime/captureConsole";
export type { CaptureConsoleOptions } from "./runtime/captureConsole";
export { createConsoleProxy } from "./runtime/createConsoleProxy";
export type { CreateConsoleProxyOptions } from "./runtime/createConsoleProxy";
export * from "./style";
export * from "./table";
