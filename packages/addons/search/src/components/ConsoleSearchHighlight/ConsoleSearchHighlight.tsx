import { useSyncExternalStore } from "react";
import type { ConsoleSearchController } from "../../index";
import "./ConsoleSearchHighlight.css";

export function ConsoleSearchHighlight({ controller, index }: {
  controller: ConsoleSearchController;
  index: number;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const matched = state.matches.find((match) => match.index === index);
  if (!matched) return null;
  const active = state.matches[state.activeIndex]?.index === index;
  return <mark className="console-search-highlight" data-active={active ? "" : undefined} aria-label={active ? "Current search match" : "Search match"}>{matched.text}</mark>;
}
