import { CAPTURED_CONSOLE_METHODS } from "../consoleMethods";
import type { ConsoleEventEmitter } from "./createConsoleEventEmitter";
import { createConsoleProxy } from "./createConsoleProxy";

export interface CaptureConsoleOptions {
  events: ConsoleEventEmitter;
  consoleTarget?: Console;
  passThrough?: boolean;
  source?: string;
}

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
