/**
 * Public entry point for @moyarich/console.
 *
 * Exports the React renderers, structured/ANSI message types, capture and
 * transport utilities, serialization helpers, event primitives, and extension
 * points used by embedded developer tools and browser runtimes.
 */

export {
  CONSOLE_ADDON_API_VERSION,
  CONSOLE_CORE_ADDON_ID_PREFIX,
  consoleCapabilities,
  consoleCoreAddonIds,
  consoleExtensionPoints,
  consoleServices,
  createConsoleViewportAddon,
  isCoreConsoleAddonId,
  createConsoleAddonManager,
  createConsoleCapability,
  createConsoleCapabilityRegistry,
  createConsoleDisposableScope,
  createConsoleExtensionPoint,
  createConsoleExtensionRegistry,
  createConsoleServiceRegistry,
  createConsoleServiceToken,
} from "./addons";
export type {
  ConsoleAddon,
  ConsoleAddonCleanup,
  ConsoleAddonHost,
  ConsoleAddonManager,
  ConsoleCapability,
  ConsoleCapabilityRegistry,
  ConsoleDisposable,
  ConsoleDisposableScope,
  ConsoleExtensionPoint,
  ConsoleExtensionRegistrationOptions,
  ConsoleExtensionRegistry,
  ConsoleServiceRegistry,
  ConsoleServiceToken,
  CreateConsoleAddonManagerOptions,
} from "./addons";
export { Console } from "./components/Console";
export type {
  ConsoleAnsiModeProps,
  ConsoleHandle,
  ConsoleMessageFilter,
  ConsoleMessageModeProps,
  ConsoleMode,
  ConsoleProps,
} from "./components/Console";
export type { ConsoleScrollOptions, ConsoleViewportService } from "./viewport";
export { ConsoleMessage } from "./components/ConsoleMessage";
export type {
  ConsoleAction,
  ConsoleActionContextBase,
  ConsoleActionPredicate,
  ConsoleActionVariant,
  ConsoleContextMenuAction,
  ConsoleContextMenuActionContext,
  ConsoleMessageAction,
  ConsoleMessageActionContext,
  ConsolePanelAction,
  ConsoleObjectActionContext,
  ConsoleSurfaceActionContext,
} from "./actions";
export { ConsoleStdout } from "./components/ConsoleStdout";
export type {
  ConsoleOutputStream,
  ConsoleStdoutEntry,
  ConsoleStdoutProps,
  ConsoleStructuredOutputParser,
  ConsoleStructuredOutputParserContext,
} from "./components/ConsoleStdout";
export { processConsoleOutputEntry } from "./processOutput";
export type {
  ConsoleProcessOutput,
  ConsoleProcessOutputMetadata,
  ConsoleProcessOutputProcessor,
  ConsoleProcessOutputProcessorContext,
  ConsoleProcessOutputProcessorResult,
} from "./processOutput";
export {
  ConsoleLinkedText,
  detectWebLinks,
  isSafeConsoleLinkTarget,
  resolveConsoleLinks,
} from "./links";
export type {
  ConsoleLink,
  ConsoleLinkActionContext,
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
  ConsoleLinkedTextProps,
} from "./links";
export { ConsoleValue } from "./components/ConsoleValue";
export { ConsoleTable } from "./components/ConsoleTable";
export { getConsoleValueType } from "./renderers";
export type {
  ConsoleMessageRenderer,
  ConsoleMessageRendererContext,
  ConsoleOutputRenderer,
  ConsoleOutputRendererContext,
  ConsoleValueRenderer,
  ConsoleValueRendererContext,
} from "./renderers";
export { CONSOLE_METHODS } from "./consoleMethods";
export { normalizeConsoleTableData } from "./utils/console/table/normalizeConsoleTableData";
export { formatConsoleObjectForCopy } from "./utils/console/formatConsoleObjectForCopy";
export { createConsoleProxy } from "./utils/console/runtime/createConsoleProxy";
export type { CreateConsoleProxyOptions } from "./utils/console/runtime/createConsoleProxy";
export { captureConsole } from "./utils/console/runtime/captureConsole";
export { createConsoleEventEmitter } from "./utils/events/createConsoleEventEmitter";
export type {
  ConsoleEventEmitter,
  ConsoleEventName,
} from "./utils/events/createConsoleEventEmitter";
export type { CaptureConsoleOptions } from "./utils/console/runtime/captureConsole";
export { useConsoleMessages } from "./hooks/useConsoleMessages";
export type { UseConsoleMessagesOptions } from "./hooks/useConsoleMessages";
export {
  serializeConsoleValue,
  deserializeConsoleValue,
  serializeConsoleMessage,
  deserializeConsoleMessage,
  serializeConsoleEvent,
  deserializeConsoleEvent,
} from "./utils/transport/serialization";
export type { SerializeConsoleValueOptions } from "./utils/transport/serialization";
export {
  CONSOLE_TRANSPORT_TYPE,
  CONSOLE_TRANSPORT_VERSION,
  DEFAULT_CONSOLE_CHANNEL,
  isConsoleEnvelope,
} from "./utils/transport/envelope";
export { listenForConsolePostMessages } from "./utils/transport/postMessage";
export type { ListenForConsolePostMessagesOptions } from "./utils/transport/postMessage";
export { listenForConsoleWebSocket } from "./utils/transport/websocket";
export type {
  ConsoleWebSocketLike,
  ListenForConsoleWebSocketOptions,
} from "./utils/transport/websocket";
export type {
  ConsoleMethod,
  ConsoleMessageData,
  RunOutput,
  DirOptions,
  ConsoleEvent,
  ConsoleTransportEnvelope,
} from "./types";
