import type { ReactNode } from "react";
import type {
  ConsoleValueRenderer,
  ConsoleValueRendererContext,
} from "./types";

/**
 * Runs value renderers in declaration order and returns the first defined result.
 *
 * Renderer errors are isolated so third-party renderers cannot break the console.
 */
export function dispatchValueRenderer(
  renderers: readonly ConsoleValueRenderer[] | undefined,
  value: unknown,
  context: ConsoleValueRendererContext,
): ReactNode | undefined {
  if (!renderers?.length) return undefined;

  for (const renderer of renderers) {
    try {
      if (renderer.type && renderer.type !== context.type) continue;
      if (renderer.match && !renderer.match(value, context)) continue;

      const rendered = renderer.render(value, context);
      if (rendered !== undefined) return rendered;
    } catch {
      // A custom renderer must not prevent the console from rendering.
    }
  }

  return undefined;
}
