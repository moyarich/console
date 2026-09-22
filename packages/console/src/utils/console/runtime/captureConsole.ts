import { CAPTURED_CONSOLE_METHODS } from "../../../consoleMethods";
import type { ConsoleEventEmitter } from "../../events/createConsoleEventEmitter";
import { createConsoleProxy } from "./createConsoleProxy";

/** Options for temporarily intercepting an existing Console object. */
export interface CaptureConsoleOptions {
  /** Event bus that receives captured message and clear events. */
  events: ConsoleEventEmitter;
  /** Console object to patch. Defaults to `globalThis.console`. */
  consoleTarget?: Console;
  /** Whether captured calls should also invoke the original method. @default true */
  passThrough?: boolean;
  /** Source metadata attached to emitted messages. @default "page" */
  source?: string;
}

/**
 * Replaces supported methods on a Console object with capture-aware wrappers.
 *
 * Calls are emitted through `events`; when `passThrough` is true the original
 * console implementation is invoked after capture.
 *
 * @returns A cleanup function that restores every method that was replaced.
 */
export function captureConsole({
  events,
  consoleTarget = globalThis.console,
  passThrough = true,
  source = "page",
}: CaptureConsoleOptions): () => void {
  const proxy = createConsoleProxy({
    events,
    source,
  });
  const originals = new Map<string, (...args: unknown[]) => unknown>();

  for (const method of CAPTURED_CONSOLE_METHODS) {
    const original = consoleTarget[method] as unknown;

    if (typeof original !== "function") {
      continue;
    }

    const boundOriginal = original.bind(consoleTarget) as (
      ...args: unknown[]
    ) => unknown;

    originals.set(method, boundOriginal);

    Object.defineProperty(consoleTarget, method, {
      configurable: true,
      writable: true,
      value: (...args: unknown[]) => {
        const proxyMethod = proxy[method] as unknown as (
          ...items: unknown[]
        ) => unknown;

        proxyMethod(...args);

        if (passThrough) {
          return boundOriginal(...args);
        }
      },
    });
  }

  return () => {
    for (const [method, original] of originals) {
      Object.defineProperty(consoleTarget, method, {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  };
}
