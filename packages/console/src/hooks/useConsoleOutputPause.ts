import { useCallback, useEffect, useState } from "react";

/** Count unseen entries without treating a truncated/replaced source as an append. */
export function countConsoleBufferedEntries<T>(
  baseline: readonly T[],
  current: readonly T[],
): number {
  if (baseline.length > current.length) return current.length;
  return baseline.every((entry, index) => current[index] === entry)
    ? current.length - baseline.length
    : current.length;
}

/** Freeze a rendered view without stopping capture or mutating the source collection. */
export function useConsoleOutputPause<T>(
  current: readonly T[],
  initiallyPaused = false,
) {
  const [paused, setPaused] = useState(initiallyPaused);
  const [displayed, setDisplayed] = useState<readonly T[]>(current);
  const [baselineItems, setBaselineItems] = useState<readonly T[]>(current);

  useEffect(() => {
    if (!paused) {
      setDisplayed(current);
      setBaselineItems(current);
    }
  }, [current, paused]);

  const pause = useCallback(() => {
    setDisplayed(current);
    setBaselineItems(current);
    setPaused(true);
  }, [current]);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);
  const clearView = useCallback(() => {
    setDisplayed([]);
    setBaselineItems([]);
  }, []);

  // A reset/replacement starts a new source history; do not report removed rows as buffered.
  const bufferedCount = paused
    ? countConsoleBufferedEntries(baselineItems, current)
    : 0;

  return {
    paused,
    displayed: paused ? displayed : current,
    bufferedCount,
    pause,
    resume,
    clearView,
  };
}
