import { createConsoleProxy } from "./createConsoleProxy";
import type { ConsoleEventSink } from "../types";

export interface CapturePageConsoleOptions {
  onEvent: ConsoleEventSink;
  target?: Console;
  passThrough?: boolean;
  source?: string;
}

const METHODS = [
  "log",
  "debug",
  "info",
  "warn",
  "error",
  "assert",
  "clear",
  "count",
  "countReset",
  "dir",
  "dirxml",
  "group",
  "groupCollapsed",
  "groupEnd",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "timeStamp",
  "trace",
] as const;

export function capturePageConsole({
  onEvent,
  target = globalThis.console,
  passThrough = true,
  source = "page",
}: CapturePageConsoleOptions): () => void {
  const proxy = createConsoleProxy({ onEvent, source });
  const originals = new Map<string, (...args: unknown[]) => unknown>();
  for (const method of METHODS) {
    const original = target[method] as unknown;
    if (typeof original !== "function") continue;
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
        if (passThrough) return boundOriginal(...args);
      },
    });
  }
  return () => {
    for (const [method, original] of originals)
      Object.defineProperty(target, method, {
        configurable: true,
        writable: true,
        value: original,
      });
  };
}
