import { motion, useReducedMotion } from "motion/react";
import { createElement, useEffect, useRef, type ReactNode } from "react";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputEntryDecorator,
} from "@moyarich/console-core";

export type ConsoleAnimationEffect =
  "fade" | "slide" | "fade-slide" | "reveal" | "typewriter";
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

/**
 * Types into the existing text nodes rather than replacing the rendered React tree.
 * Links, ANSI spans, and custom value markup retain their nodes and event handlers.
 */
function TypewriterEntry({
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
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const element = root.current;
    if (!element || reducedMotion || (id !== undefined && completed.has(id))) {
      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const entries: Array<{ node: Text; value: string }> = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      if (text.textContent) entries.push({ node: text, value: text.textContent });
    }
    const total = entries.reduce((sum, entry) => sum + Array.from(entry.value).length, 0);
    if (!total) {
      if (id !== undefined) completed.add(id);
      return;
    }

    const segments = entries.map(({ value }) => Array.from(value));
    const originals = entries.map(({ node, value }) => ({ node, value }));
    for (const entry of entries) entry.node.textContent = "";

    let position = 0;
    const duration = Math.max(0, options.duration ?? 0.3) * 1000;
    const stepTime = total ? duration / total : 0;
    const startDelay = getConsoleAnimationDelay(index, options) * 1000;
    let ticker: ReturnType<typeof setInterval> | undefined;
    const reveal = () => {
      position += 1;
      let remaining = position;
      entries.forEach((entry, i) => {
        const chars = segments[i]!;
        const amount = Math.min(chars.length, Math.max(0, remaining));
        entry.node.textContent = chars.slice(0, amount).join("");
        remaining -= amount;
      });
      if (position >= total) {
        if (ticker !== undefined) clearInterval(ticker);
        if (id !== undefined) completed.add(id);
      }
    };
    const start = setTimeout(() => {
      if (stepTime <= 0) {
        entries.forEach((entry, i) => { entry.node.textContent = originals[i]!.value; });
        if (id !== undefined) completed.add(id);
      } else {
        ticker = setInterval(reveal, Math.max(1, stepTime));
      }
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (ticker !== undefined) clearInterval(ticker);
      for (const entry of originals) entry.node.textContent = entry.value;
    };
  }, [id, index, completed, options, reducedMotion]);

  return createElement("div", { ref: root, children });
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
  if (options.effect === "typewriter") {
    return createElement(TypewriterEntry, { id, index, completed, options, children });
  }
  const alreadyCompleted = id !== undefined && completed.has(id);
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
