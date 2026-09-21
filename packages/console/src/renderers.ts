import type { ReactNode } from "react";
import type { ConsoleMethod, ConsoleMessageData } from "./types";

export interface ConsoleMessageRendererContext {
  index: number;
  messages: readonly ConsoleMessageData[];
  renderDefault: () => ReactNode;
}

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

export interface ConsoleValueRendererContext {
  propertyKey?: string;
  depth: number;
  type: string;
  renderDefault: () => ReactNode;
}

export interface ConsoleValueRenderer {
  type?: string;
  match?: (value: unknown, context: ConsoleValueRendererContext) => boolean;
  render: (
    value: unknown,
    context: ConsoleValueRendererContext,
  ) => ReactNode | undefined;
}

export function getConsoleValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";

  if (typeof value !== "object") {
    return typeof value;
  }

  return value.constructor?.name || "object";
}

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
