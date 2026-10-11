import { useCallback, useEffect, useRef, useState } from "react";

/** Freeze a rendered view without stopping capture or mutating the source collection. */
export function useConsoleOutputPause<T>(
  current: readonly T[],
  initiallyPaused = false,
) {
  const [paused, setPaused] = useState(initiallyPaused);
  const [displayed, setDisplayed] = useState<readonly T[]>(current);
  const [baselineItems, setBaselineItems] = useState<readonly T[]>(current);
  const baseline = useRef(current.length);

  useEffect(() => {
    if (!paused) {
      setDisplayed(current);
      baseline.current = current.length;
      setBaselineItems(current);
    }
  }, [current, paused]);

  const pause = useCallback(() => {
    baseline.current = current.length;
    setDisplayed(current);
    setBaselineItems(current);
    setPaused(true);
  }, [current]);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);
  const clearView = useCallback(() => {
    baseline.current = 0;
    setDisplayed([]);
    setBaselineItems([]);
  }, []);

  // A reset/replacement starts a new source history; do not report removed rows as buffered.
  const bufferedCount = paused
    ? current.length >= baseline.current &&
      baselineItems.every((entry, index) => current[index] === entry)
      ? current.length - baseline.current
      : current.length
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
