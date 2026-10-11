import type { ConsoleAnimationOptions } from "./types";

/** Pure sequencing helper. */
export function getConsoleAnimationDelay(
  index: number,
  options: ConsoleAnimationOptions = {},
): number {
  return (
    Math.max(0, options.wait ?? 0) +
    Math.max(0, index) * Math.max(0, options.stagger ?? 0)
  );
}

