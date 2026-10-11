import { motion, useReducedMotion } from "motion/react";
import {
  createElement,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimationSequence } from "../../AnimationSequence";
import { getConsoleAnimationDelay } from "../../getConsoleAnimationDelay";
import { TypewriterEntry } from "../TypewriterEntry/TypewriterEntry";
import type { ConsoleAnimationOptions } from "../../types";

export function AnimatedEntry({
  id,
  index,
  completed,
  sequence,
  options,
  children,
}: {
  id?: string;
  index: number;
  completed: Set<string>;
  sequence: AnimationSequence;
  options: ConsoleAnimationOptions;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const active =
    useSyncExternalStore(sequence.subscribe, sequence.snapshot, () => 0) >=
    index;
  const ready = !options.sequence || active;
  const alreadyCompleted = id !== undefined && completed.has(id);
  useEffect(() => {
    if (ready && (reducedMotion || alreadyCompleted)) sequence.complete(index);
  }, [ready, reducedMotion, alreadyCompleted, sequence, index]);
  if (options.effect === "typewriter") {
    return createElement(TypewriterEntry, {
      id,
      index,
      completed,
      sequence,
      options,
      children,
    });
  }
  const effect = options.effect ?? "fade-slide";
  const distance = options.distance ?? 12;
  const initial =
    effect === "fade"
      ? { opacity: 0 }
      : effect === "slide"
        ? { y: distance }
        : effect === "reveal"
          ? { clipPath: "inset(0 100% 0 0)" }
          : { opacity: 0, y: distance };
  const animate =
    effect === "fade"
      ? { opacity: 1 }
      : effect === "slide"
        ? { y: 0 }
        : effect === "reveal"
          ? { clipPath: "inset(0 0% 0 0)" }
          : { opacity: 1, y: 0 };
  return createElement(motion.div, {
    initial: reducedMotion || alreadyCompleted || !ready ? false : initial,
    animate: ready ? animate : initial,
    transition: {
      duration:
        reducedMotion || alreadyCompleted
          ? 0
          : Math.max(0, options.duration ?? 0.3),
      delay:
        reducedMotion || alreadyCompleted
          ? 0
          : options.sequence
            ? index === 0
              ? Math.max(0, options.wait ?? 0)
              : Math.max(0, options.stagger ?? 0)
            : getConsoleAnimationDelay(index, options),
    },
    onAnimationComplete: () => {
      if (ready) {
        if (id !== undefined) completed.add(id);
        sequence.complete(index);
      }
    },
    style: {
      visibility: options.sequence && !ready ? "hidden" : undefined,
      overflow:
        effect === "reveal" && !reducedMotion && !alreadyCompleted
          ? "hidden"
          : undefined,
    },
    children,
  });
}
