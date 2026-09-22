import type { ReactNode } from "react";
import type { ConsoleMethod, ConsoleMessageData } from "../types";

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
