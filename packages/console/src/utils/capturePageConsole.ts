import { CAPTURED_CONSOLE_METHODS } from "../consoleMethods";
import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";
import { createConsoleProxy } from "./createConsoleProxy";

export interface CapturePageConsoleOptions {
  events: ConsoleEventEmitter;
  target?: Console;
  passThrough?: boolean;
  source?: string;
}

export function capturePageConsole({
  events,
  target = globalThis.console,
  passThrough = true,
  source = "page",
}: CapturePageConsoleOptions): () => void {
  const proxy = createConsoleProxy({
    onEvent: events.dispatch,
    source,
  });
  const originals = new Map<string, (...args: unknown[]) => unknown>();

  for (const method of CAPTURED_CONSOLE_METHODS) {
    const original = target[method] as unknown;

    if (typeof original !== "function") {
      continue;
    }

    const boundOriginal = original.bind(target) as (
      ...args: unknown[]
    ) => unknown;

    originals.set(method, boundOriginal);

    Object.defineProperty(target, method, {
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
      Object.defineProperty(target, method, {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  };
}
