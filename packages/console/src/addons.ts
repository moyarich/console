import {
  createConsoleCapability,
  createConsoleExtensionPoint,
  createConsoleServiceToken,
} from "@moyarich/console-core";
import type {
  ConsoleContextMenuAction,
  ConsoleMessageAction,
  ConsolePanelAction,
} from "./actions";
import type { ConsoleDataService } from "./data";
import type { ConsoleLinkProvider } from "./links";
import type { ConsoleProcessOutputProcessor } from "./processOutput";
import type {
  ConsoleMessageRenderer,
  ConsoleOutputRenderer,
  ConsoleValueRenderer,
} from "./renderers";
import type { ConsoleStructuredOutputParser } from "./utils/terminal/types";
import type { ConsoleViewportService } from "./viewport";

export {
  CONSOLE_ADDON_API_VERSION,
  createConsoleAddonManager,
  createConsoleCapability,
  createConsoleCapabilityRegistry,
  createConsoleDisposableScope,
  createConsoleExtensionPoint,
  createConsoleExtensionRegistry,
  createConsoleServiceRegistry,
  createConsoleServiceToken,
} from "@moyarich/console-core";
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
} from "@moyarich/console-core";

/** Built-in capabilities advertised by the React console host. */
export const consoleCapabilities = Object.freeze({
  react: createConsoleCapability("console.react"),
  dom: createConsoleCapability("console.dom"),
  structuredMessages: createConsoleCapability("console.structuredMessages"),
  processOutput: createConsoleCapability("console.processOutput"),
});

/** Built-in services supplied by the React console host. */
export const consoleServices = Object.freeze({
  viewport:
    createConsoleServiceToken<ConsoleViewportService>("console.viewport"),
  data: createConsoleServiceToken<ConsoleDataService>("console.data"),
});

/** Built-in extension points backed by the console's existing hook contracts. */
export const consoleExtensionPoints = Object.freeze({
  processOutputProcessor:
    createConsoleExtensionPoint<ConsoleProcessOutputProcessor>(
      "console.process.output",
    ),
  structuredOutputParser:
    createConsoleExtensionPoint<ConsoleStructuredOutputParser>(
      "console.process.structuredOutputParser",
    ),
  linkProvider: createConsoleExtensionPoint<ConsoleLinkProvider>(
    "console.linkProvider",
  ),
  outputRenderer: createConsoleExtensionPoint<ConsoleOutputRenderer>(
    "console.render.output",
  ),
  messageRenderer: createConsoleExtensionPoint<ConsoleMessageRenderer>(
    "console.render.message",
  ),
  valueRenderer: createConsoleExtensionPoint<ConsoleValueRenderer>(
    "console.render.value",
  ),
  panelAction: createConsoleExtensionPoint<ConsolePanelAction>(
    "console.action.panel",
  ),
  contextMenuAction: createConsoleExtensionPoint<ConsoleContextMenuAction>(
    "console.action.contextMenu",
  ),
  messageAction: createConsoleExtensionPoint<ConsoleMessageAction>(
    "console.action.message",
  ),
});
