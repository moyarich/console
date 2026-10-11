import { useCallback, useEffect, useRef, useState } from "react";

/** Freeze a rendered view without stopping capture or mutating the source collection. */
export function useConsoleOutputPause<T>(
  current: readonly T[],
  initiallyPaused = false,
) {
  const [paused, setPaused] = useState(initiallyPaused);
  const [displayed, setDisplayed] = useState<readonly T[]>(current);
  const baseline = useRef(current.length);

  useEffect(() => {
    if (!paused) {
      setDisplayed(current);
      baseline.current = current.length;
    }
  }, [current, paused]);

  const pause = useCallback(() => {
    baseline.current = current.length;
    setDisplayed(current);
    setPaused(true);
  }, [current]);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);
  const clearView = useCallback(() => {
    baseline.current = 0;
    setDisplayed([]);
  }, []);

  return {
    paused,
    displayed: paused ? displayed : current,
    bufferedCount: paused ? Math.max(0, current.length - baseline.current) : 0,
    pause,
    resume,
    clearView,
  };
}
