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
      options.caseSensitive ? "" : "i",
    );
  } catch (error) {
    return {
      matches: [],
      error: error instanceof Error ? error.message : "Invalid pattern",
    };
  }
  return {
    matches: entries.flatMap((entry, index) => {
      if (!entry.id) return [];
      const matched = pattern.exec(entry.text);
      if (!matched) return [];
      if (options.wholeWord) {
        const before = entry.text[matched.index - 1] ?? "";
        const after = entry.text[matched.index + matched[0].length] ?? "";
        if (/\w/.test(before) || /\w/.test(after)) return [];
      }
      return [{ id: entry.id, index, text: entry.text }];
    }),
  };
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
      const activeId = state.matches[state.activeIndex]?.id;
      const nextIndex = result.matches.findIndex(
        (match) => match.id === activeId,
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
      const subscription = data?.subscribe(() => controller.refresh());
      return () => {
        subscription?.dispose();
        data = undefined;
        viewport = undefined;
      };
    },
  };
}
