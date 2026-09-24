import type { ReactNode } from "react";
import type {
  ConsoleMessageRenderer as CoreConsoleMessageRenderer,
  ConsoleMessageRendererContext as CoreConsoleMessageRendererContext,
  ConsoleOutputRenderer as CoreConsoleOutputRenderer,
  ConsoleOutputRendererContext as CoreConsoleOutputRendererContext,
  ConsoleValueRenderer as CoreConsoleValueRenderer,
  ConsoleValueRendererContext as CoreConsoleValueRendererContext,
} from "./addons";

/** Context provided to a renderer that can replace the console output surface. */
export type ConsoleOutputRendererContext =
  CoreConsoleOutputRendererContext<ReactNode>;

/** Renderer for the complete inner output surface. */
export type ConsoleOutputRenderer = CoreConsoleOutputRenderer<ReactNode>;

/** Context provided to custom structured-message renderers. */
export type ConsoleMessageRendererContext =
  CoreConsoleMessageRendererContext<ReactNode>;

/** Custom renderer for structured console messages. */
export type ConsoleMessageRenderer = CoreConsoleMessageRenderer<ReactNode>;

/** Context provided to custom value renderers. */
export type ConsoleValueRendererContext =
  CoreConsoleValueRendererContext<ReactNode>;

/** Custom renderer for individual console values. */
export type ConsoleValueRenderer = CoreConsoleValueRenderer<ReactNode>;

/**
 * Returns the type discriminator used by {@link ConsoleValueRenderer.type}.
 */
export function getConsoleValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";

  if (typeof value !== "object") {
    return typeof value;
  }

  return value.constructor?.name || "object";
}

/**
 * Runs complete-output renderers in declaration order and returns the first
 * defined result.
 *
 * Renderer errors are isolated so third-party surfaces cannot break the
 * built-in console fallback.
 */
export function dispatchOutputRenderer(
  renderers: readonly ConsoleOutputRenderer[] | undefined,
  context: ConsoleOutputRendererContext,
): ReactNode | undefined {
  if (!renderers?.length) return undefined;

  for (const renderer of renderers) {
    try {
      if (renderer.mode && renderer.mode !== context.mode) continue;
      if (renderer.match && !renderer.match(context)) continue;

      const rendered = renderer.render(context);
      if (rendered !== undefined) return rendered;
    } catch {
      // A custom output renderer must not prevent the default surface.
    }
  }

  return undefined;
}

/**
 * Runs message renderers in declaration order and returns the first defined result.
 *
 * Renderer errors are isolated so third-party renderers cannot break the console.
 */
export function dispatchMessageRenderer(
  renderers: readonly ConsoleMessageRenderer[] | undefined,
  context: ConsoleMessageRendererContext,
): ReactNode | undefined {
  if (!renderers?.length) return undefined;

  for (const renderer of renderers) {
    try {
      if (renderer.method && renderer.method !== context.message.method)
        continue;
      if (renderer.match && !renderer.match(context)) continue;

      const rendered = renderer.render(context);
      if (rendered !== undefined) return rendered;
    } catch {
      // A custom renderer must not prevent the console from rendering.
    }
  }

  return undefined;
}

/**
 * Runs value renderers in declaration order and returns the first defined result.
 *
 * Renderer errors are isolated so third-party renderers cannot break the console.
 */
export function dispatchValueRenderer(
  renderers: readonly ConsoleValueRenderer[] | undefined,
  context: ConsoleValueRendererContext,
): ReactNode | undefined {
  if (!renderers?.length) return undefined;

  for (const renderer of renderers) {
    try {
      if (renderer.type && renderer.type !== context.type) continue;
      if (renderer.match && !renderer.match(context)) continue;

      const rendered = renderer.render(context);
      if (rendered !== undefined) return rendered;
    } catch {
      // A custom renderer must not prevent the console from rendering.
    }
  }

  return undefined;
}
