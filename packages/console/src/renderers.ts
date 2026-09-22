import type { ReactNode } from "react";
import type { ConsoleStdoutEntry } from "./processOutput";
import type { ConsoleMethod, ConsoleMessageData, ConsoleMode } from "./types";

/** Context provided to a renderer that can replace the console output surface. */
export type ConsoleOutputRendererContext =
  | {
      mode: "console";
      messages: readonly ConsoleMessageData[];
      renderDefault: () => ReactNode;
    }
  | {
      mode: "ansi";
      entries: readonly (ConsoleStdoutEntry | string)[];
      renderDefault: () => ReactNode;
    };

/**
 * Renderer for the complete inner output surface.
 *
 * Returning `undefined` delegates to the next renderer and eventually the
 * built-in structured or ANSI renderer. Any other React result, including
 * `null`, counts as an intentional replacement.
 */
export interface ConsoleOutputRenderer {
  mode?: ConsoleMode;
  match?: (context: ConsoleOutputRendererContext) => boolean;
  render: (context: ConsoleOutputRendererContext) => ReactNode | undefined;
}

/** Context provided to custom structured-message renderers. */
export interface ConsoleMessageRendererContext {
  index: number;
  messages: readonly ConsoleMessageData[];
  renderDefault: () => ReactNode;
}

/**
 * Custom renderer for structured console messages.
 *
 * Returning `undefined` allows the next renderer, or the built-in renderer,
 * to handle the message.
 */
export interface ConsoleMessageRenderer {
  method?: ConsoleMethod;
  match?: (
    message: ConsoleMessageData,
    context: ConsoleMessageRendererContext,
  ) => boolean;
  render: (
    message: ConsoleMessageData,
    context: ConsoleMessageRendererContext,
  ) => ReactNode | undefined;
}

/** Context provided to custom value renderers. */
export interface ConsoleValueRendererContext {
  propertyKey?: string;
  depth: number;
  type: string;
  renderDefault: () => ReactNode;
}

/**
 * Custom renderer for individual console values.
 *
 * Returning `undefined` delegates to the next matching renderer.
 */
export interface ConsoleValueRenderer {
  type?: string;
  match?: (value: unknown, context: ConsoleValueRendererContext) => boolean;
  render: (
    value: unknown,
    context: ConsoleValueRendererContext,
  ) => ReactNode | undefined;
}

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
