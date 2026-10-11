import { createElement, type ReactNode } from "react";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputEntryDecorator,
} from "@moyarich/console-core";
import { AnimatedEntry } from "./AnimatedEntry";
import { AnimationSequence } from "./AnimationSequence";
import type { ConsoleAnimationOptions } from "./types";

export type { ConsoleAnimationEffect, ConsoleAnimationOptions } from "./types";
export { getConsoleAnimationDelay } from "./getConsoleAnimationDelay";

export const CONSOLE_ANIMATION_ADDON_ID = "@moyarich/console-addon-animation";

/** Registers opt-in entry animations without replacing links, ANSI, or value renderers. */
export function createConsoleAnimationAddon(
  options: ConsoleAnimationOptions = {},
): ConsoleAddon {
  return {
    id: CONSOLE_ANIMATION_ADDON_ID,
    activate(host) {
      const completed = new Set<string>();
      const sequence = new AnimationSequence();
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
            sequence,
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
      host.scope.defer(() => sequence.clear());
    },
  };
}
