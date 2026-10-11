import { createElement } from "react";
import {
  consoleExtensionPoints,
  type ConsolePanelElement,
  type ConsoleMessageDecoration,
  type ConsoleTextHighlightProvider,
} from "@moyarich/console-core";
import { ConsoleSearchControls } from "./components/ConsoleSearchControls/ConsoleSearchControls";
import { ConsoleSearchHighlight } from "./components/ConsoleSearchHighlight/ConsoleSearchHighlight";
export { ConsoleSearchHighlight } from "./components/ConsoleSearchHighlight/ConsoleSearchHighlight";
export { ConsoleSearchControls } from "./components/ConsoleSearchControls/ConsoleSearchControls";
import {
  consoleServices,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleDataService,
  type ConsoleViewportService,
} from "@moyarich/console-core";

export const CONSOLE_SEARCH_ADDON_ID = "@moyarich/console-addon-search";
export interface ConsoleSearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}
export interface ConsoleSearchMatch {
  id: string;
  index: number;
  text: string;
  /** Offset of this occurrence within the searchable text. */
  start: number;
  end: number;
}
export interface ConsoleSearchState {
  query: string;
  options: ConsoleSearchOptions;
  matches: readonly ConsoleSearchMatch[];
  activeIndex: number;
  error?: string;
}
export interface ConsoleSearchController {
  getState(): ConsoleSearchState;
  subscribe(listener: () => void): () => void;
  setQuery(query: string): void;
  setOptions(options: ConsoleSearchOptions): void;
  refresh(): void;
  next(): ConsoleSearchMatch | undefined;
  previous(): ConsoleSearchMatch | undefined;
}
export const consoleSearchService =
  createConsoleServiceToken<ConsoleSearchController>(
    `${CONSOLE_SEARCH_ADDON_ID}.controller`,
  );
export function findConsoleSearchMatches(
  entries: readonly { id?: string; text: string }[],
  query: string,
  options: ConsoleSearchOptions = {},
): { matches: ConsoleSearchMatch[]; error?: string } {
  if (!query) return { matches: [] };
  let pattern: RegExp;
  try {
    pattern = new RegExp(
      options.regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      options.caseSensitive ? "g" : "gi",
    );
  } catch (error) {
    return {
      matches: [],
      error: error instanceof Error ? error.message : "Invalid pattern",
    };
  }
  const matches: ConsoleSearchMatch[] = [];
  for (const [index, entry] of entries.entries()) {
    pattern.lastIndex = 0;
    let hit: RegExpExecArray | null;
    while ((hit = pattern.exec(entry.text)) !== null) {
      const before = entry.text[hit.index - 1] ?? "";
      const after = entry.text[hit.index + hit[0].length] ?? "";
      if (!options.wholeWord || (!/\w/.test(before) && !/\w/.test(after))) {
        matches.push({
          id: entry.id ?? String(index),
          index,
          text: hit[0],
          start: hit.index,
          end: hit.index + hit[0].length,
        });
      }
      if (hit[0].length === 0) pattern.lastIndex++;
    }
  }
  return { matches };
}
export function createConsoleSearchAddon(): ConsoleAddon & {
  controller: ConsoleSearchController;
} {
  let data: ConsoleDataService | undefined;
  let viewport: ConsoleViewportService | undefined;
  let state: ConsoleSearchState = {
    query: "",
    options: {},
    matches: [],
    activeIndex: -1,
  };
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  const controller: ConsoleSearchController = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setQuery(query) {
      state = { ...state, query };
      controller.refresh();
    },
    setOptions(options) {
      state = { ...state, options };
      controller.refresh();
    },
    refresh() {
      const snapshot = data?.getSnapshot();
      const entries =
        snapshot?.mode === "console"
          ? snapshot.visible.map((message, index) => ({
              id: message.id ?? `console-${index}`,
              text: [
                message.method,
                message.source,
                ...message.data.map(String),
              ].join(" "),
            }))
          : snapshot?.mode === "terminal"
            ? snapshot.visible.map((entry, index) => ({
                id: entry.entry.id ?? `terminal-${index}`,
                text: entry.output.data,
              }))
            : [];
      const result = findConsoleSearchMatches(
        entries,
        state.query,
        state.options,
      );
      const activeMatch = state.matches[state.activeIndex];
      const nextIndex = result.matches.findIndex(
        (match) =>
          match.id === activeMatch?.id &&
          match.index === activeMatch.index &&
          match.text === activeMatch.text &&
          match.start === activeMatch.start,
      );
      state = { ...state, ...result, activeIndex: nextIndex };
      emit();
    },
    next() {
      controller.refresh();
      if (!state.matches.length) return undefined;
      const activeIndex = (state.activeIndex + 1) % state.matches.length;
      state = { ...state, activeIndex };
      emit();
      const match = state.matches[activeIndex]!;
      viewport?.scrollToMessage(match.id);
      return match;
    },
    previous() {
      controller.refresh();
      if (!state.matches.length) return undefined;
      const activeIndex =
        (state.activeIndex + state.matches.length - 1) % state.matches.length;
      state = { ...state, activeIndex };
      emit();
      const match = state.matches[activeIndex]!;
      viewport?.scrollToMessage(match.id);
      return match;
    },
  };
  return {
    id: CONSOLE_SEARCH_ADDON_ID,
    controller,
    activate(host) {
      data = host.services.get(consoleServices.data);
      viewport = host.services.get(consoleServices.viewport);
      host.services.provide(consoleSearchService, controller);
      const textHighlightProvider: ConsoleTextHighlightProvider = {
        subscribe: controller.subscribe,
        getSnapshot: controller.getState,
        getRanges(text, context) {
          if (!state.query) return [];
          const matches = findConsoleSearchMatches(
            [{ id: context.id ?? "local", text }],
            state.query,
            state.options,
          ).matches;
          const active = state.matches[state.activeIndex];
          return matches
            .filter((match) => match.end > match.start)
            .map((match, index) => ({
              start: match.start,
              end: match.end,
              active: active?.id === context.id &&
                active.text === match.text &&
                state.matches.filter((item) => item.id === active.id && item.text === active.text)
                  .findIndex((item) => item.start === active.start) === index,
            }));
        },
      };
      host.extensions.register(
        consoleExtensionPoints.textHighlightProvider,
        textHighlightProvider,
        { id: CONSOLE_SEARCH_ADDON_ID + ":inline" },
      );
      const highlight: ConsoleMessageDecoration = {
        id: CONSOLE_SEARCH_ADDON_ID + ":highlight",
        placement: "badge",
        render: ({ index }) =>
          createElement(ConsoleSearchHighlight, { controller, index }),
      };
      host.extensions.register(
        consoleExtensionPoints.messageDecoration,
        highlight,
        { id: highlight.id },
      );
      const panel: ConsolePanelElement = {
        id: CONSOLE_SEARCH_ADDON_ID + ":controls",
        placement: "before-output",
        render: () => createElement(ConsoleSearchControls, { controller }),
      };
      host.extensions.register(consoleExtensionPoints.panelElement, panel, {
        id: panel.id,
      });
      for (const shortcut of [
        {
          id: CONSOLE_SEARCH_ADDON_ID + ":next",
          key: "F3",
          onTrigger: () => {
            controller.next();
          },
        },
        {
          id: CONSOLE_SEARCH_ADDON_ID + ":previous",
          key: "F3",
          shiftKey: true,
          onTrigger: () => {
            controller.previous();
          },
        },
      ])
        host.extensions.register(
          consoleExtensionPoints.keyboardShortcut,
          shortcut,
          { id: shortcut.id },
        );

      const subscription = data?.subscribe(() => controller.refresh());
      return () => {
        subscription?.dispose();
        data = undefined;
        viewport = undefined;
      };
    },
  };
}
