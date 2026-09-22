import type { ReactNode } from "react";
import type { ConsoleMessageData } from "../types";
import type {
  ConsoleMessageRenderer,
  ConsoleMessageRendererContext,
} from "./types";

/**
 * Runs message renderers in declaration order and returns the first defined result.
 *
 * Renderer errors are isolated so third-party renderers cannot break the console.
 */
export function dispatchMessageRenderer(
  renderers: readonly ConsoleMessageRenderer[] | undefined,
  message: ConsoleMessageData,
  context: ConsoleMessageRendererContext,
): ReactNode | undefined {
  if (!renderers?.length) return undefined;

  for (const renderer of renderers) {
    try {
      if (renderer.method && renderer.method !== message.method) continue;
      if (renderer.match && !renderer.match(message, context)) continue;

      const rendered = renderer.render(message, context);
      if (rendered !== undefined) return rendered;
    } catch {
      // A custom renderer must not prevent the console from rendering.
    }
  }

  return undefined;
}
