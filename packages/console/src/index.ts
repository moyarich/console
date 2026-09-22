/**
 * Public entry point for @moyarich/console.
 *
 * Exports the React renderers, structured/ANSI message types, capture and
 * transport utilities, serialization helpers, event primitives, and extension
 * points used by embedded developer tools and browser runtimes.
 */

export { Console } from "./components/Console";
export type {
  ConsoleAnsiModeProps,
  ConsoleMessageFilter,
  ConsoleMessageModeProps,
  ConsoleMode,
  ConsoleProps,
} from "./components/Console";
export { ConsoleMessage } from "./components/ConsoleMessage";
export type {
  ConsoleMessageRenderer,
  ConsoleMessageRendererContext,
} from "./components/ConsoleMessage";
export type {
  ConsoleAction,
  ConsoleActionContextBase,
  ConsoleActionPredicate,
  ConsoleActionVariant,
  ConsoleContextMenuAction,
  ConsoleContextMenuActionContext,
  ConsoleMessageAction,
  ConsoleMessageActionContext,
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
export { processConsoleOutputEntry } from "./cliOutput/processOutput";
export type {
  ConsoleProcessOutput,
  ConsoleProcessOutputMetadata,
} from "./cliOutput/types";
export type {
  ConsoleProcessOutputProcessor,
  ConsoleProcessOutputProcessorContext,
  ConsoleProcessOutputProcessorResult,
} from "./cliOutput/processors/types";
export { ConsoleLinkedText } from "./components/ConsoleLinkedText";
export { detectWebLinks } from "./links/detectWebLinks";
export { isSafeConsoleLinkTarget } from "./links/isSafeConsoleLinkTarget";
export { resolveConsoleLinks } from "./links/resolveConsoleLinks";
export type {
  ConsoleLink,
  ConsoleLinkActionContext,
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
} from "./links/types";
export type { ConsoleLinkedTextProps } from "./components/ConsoleLinkedText";
export { ConsoleValue } from "./components/ConsoleValue";
export type {
  ConsoleValueRenderer,
  ConsoleValueRendererContext,
} from "./components/ConsoleValue";
export { ConsoleTable } from "./components/ConsoleTable";
export { CONSOLE_METHODS } from "./console/consoleMethods";
export { normalizeConsoleTableData } from "./utils/table/normalizeConsoleTableData";
export { formatConsoleObjectForCopy } from "./utils/values/formatConsoleObjectForCopy";
export { createConsoleProxy } from "./console/createConsoleProxy";
export type {
  CreateConsoleProxyOptions,
  DirOptions,
} from "./console/createConsoleProxy";
export { captureConsole } from "./console/captureConsole";
export { createConsoleEventEmitter } from "./utils/events/createConsoleEventEmitter";
export type {
  ConsoleEventEmitter,
  ConsoleEventName,
} from "./utils/events/createConsoleEventEmitter";
export type { CaptureConsoleOptions } from "./console/captureConsole";
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
export type { ConsoleTransportEnvelope } from "./utils/transport/envelope";
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
  ConsoleEvent,
} from "./types";
