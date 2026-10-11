import { useReducedMotion } from "motion/react";
import {
  createElement,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimationSequence } from "../../AnimationSequence";
import { getConsoleAnimationDelay } from "../../getConsoleAnimationDelay";
import type { ConsoleAnimationOptions } from "../../types";

/**
 * Types into the existing text nodes rather than replacing the rendered React tree.
 * Links, ANSI spans, and custom value markup retain their nodes and event handlers.
 */
export function TypewriterEntry({
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
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const active =
    useSyncExternalStore(sequence.subscribe, sequence.snapshot, () => 0) >=
    index;
  const ready = !options.sequence || active;
  const done = () => {
    if (id !== undefined) completed.add(id);
    sequence.complete(index);
  };
  useEffect(() => {
    if (ready && (reducedMotion || (id !== undefined && completed.has(id)))) {
      sequence.complete(index);
    }
  }, [ready, reducedMotion, id, index, completed, sequence]);
  useEffect(() => {
    const element = root.current;
    if (
      !element ||
      !ready ||
      reducedMotion ||
      (id !== undefined && completed.has(id))
    ) {
      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const entries: Array<{ node: Text; value: string }> = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      if (text.textContent)
        entries.push({ node: text, value: text.textContent });
    }
    const total = entries.reduce(
      (sum, entry) => sum + Array.from(entry.value).length,
      0,
    );
    if (!total) {
      done();
      return;
    }

    const segments = entries.map(({ value }) => Array.from(value));
    const originals = entries.map(({ node, value }) => ({ node, value }));
    for (const entry of entries) entry.node.textContent = "";

    let position = 0;
    const duration = Math.max(0, options.duration ?? 0.3) * 1000;
    const stepTime = total ? duration / total : 0;
    const startDelay =
      (options.sequence
        ? index === 0
          ? Math.max(0, options.wait ?? 0)
          : Math.max(0, options.stagger ?? 0)
        : getConsoleAnimationDelay(index, options)) * 1000;
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
        done();
      }
    };
    const start = setTimeout(() => {
      if (stepTime <= 0) {
        entries.forEach((entry, i) => {
          entry.node.textContent = originals[i]!.value;
        });
        done();
      } else {
        ticker = setInterval(reveal, Math.max(1, stepTime));
      }
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (ticker !== undefined) clearInterval(ticker);
      for (const entry of originals) entry.node.textContent = entry.value;
    };
  }, [id, index, completed, options, reducedMotion, ready, sequence]);

  return createElement("div", {
    ref: root,
    style: { visibility: options.sequence && !ready ? "hidden" : undefined },
    children,
  });
}
