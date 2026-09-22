/** Shared link detection and provider extension APIs. */
export { detectWebLinks } from "./detectWebLinks";
export { isSafeConsoleLinkTarget } from "./isSafeConsoleLinkTarget";
export { resolveConsoleLinks } from "./resolveConsoleLinks";
export type {
  ConsoleLink,
  ConsoleLinkActionContext,
  ConsoleLinkProvider,
  ConsoleLinkProviderContext,
} from "./types";
