import { motion, useReducedMotion } from "motion/react";
import { createElement, type ReactNode } from "react";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputEntryDecorator,
} from "@moyarich/console-core";

export type ConsoleAnimationEffect =
  "fade" | "slide" | "fade-slide" | "typewriter";
export interface ConsoleAnimationOptions {
  effect?: ConsoleAnimationEffect;
  /** Duration in seconds. */
  duration?: number;
  /** Delay between successive entries, in seconds. */
  stagger?: number;
  /** Initial wait, in seconds. */
  wait?: number;
  /** Vertical slide distance, in pixels. */
  distance?: number;
}
export const CONSOLE_ANIMATION_ADDON_ID = "@moyarich/console-addon-animation";

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

function AnimatedEntry({
  id,
  index,
  completed,
  options,
  children,
}: {
  id?: string;
  index: number;
  completed: Set<string>;
  options: ConsoleAnimationOptions;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const alreadyCompleted = id !== undefined && completed.has(id);
  const effect = options.effect ?? "fade-slide";
  const distance = options.distance ?? 12;
  const initial =
    effect === "fade"
      ? { opacity: 0 }
      : effect === "slide"
        ? { y: distance }
        : effect === "typewriter"
          ? { clipPath: "inset(0 100% 0 0)" }
          : { opacity: 0, y: distance };
  const animate =
    effect === "fade"
      ? { opacity: 1 }
      : effect === "slide"
        ? { y: 0 }
        : effect === "typewriter"
          ? { clipPath: "inset(0 0% 0 0)" }
          : { opacity: 1, y: 0 };
  return createElement(motion.div, {
    initial: reducedMotion || alreadyCompleted ? false : initial,
    animate,
    transition: {
      duration:
        reducedMotion || alreadyCompleted
          ? 0
          : Math.max(0, options.duration ?? 0.3),
      delay:
        reducedMotion || alreadyCompleted
          ? 0
          : getConsoleAnimationDelay(index, options),
    },
    onAnimationComplete: () => {
      if (id !== undefined) completed.add(id);
    },
    style: {
      overflow:
        effect === "typewriter" && !reducedMotion && !alreadyCompleted
          ? "hidden"
          : undefined,
    },
    children,
  });
}

/** Registers opt-in entry animations without replacing links, ANSI, or value renderers. */
export function createConsoleAnimationAddon(
  options: ConsoleAnimationOptions = {},
): ConsoleAddon {
  return {
    id: CONSOLE_ANIMATION_ADDON_ID,
    activate(host) {
      const completed = new Set<string>();
      const decorator: ConsoleOutputEntryDecorator<ReactNode> = {
        render(context) {
          const id =
            context.id === undefined
              ? undefined
              : context.mode + ":" + context.id;
          return createElement(AnimatedEntry, {
            key: id ?? context.mode + ":" + context.index,
            id,
            index: context.index,
            completed,
            options,
            children: context.renderDefault(),
          });
        },
      };
      const registration = host.extensions.register(
        consoleExtensionPoints.outputEntryDecorator,
        decorator,
        { id: CONSOLE_ANIMATION_ADDON_ID },
      );
      host.scope.defer(() => registration.dispose());
      host.scope.defer(() => completed.clear());
    },
  };
}
