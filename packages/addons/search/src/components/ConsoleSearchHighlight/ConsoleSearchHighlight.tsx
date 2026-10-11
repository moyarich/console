import { useSyncExternalStore } from "react";
import type { ConsoleSearchController } from "../../index";
import "./ConsoleSearchHighlight.css";

export function ConsoleSearchHighlight({
  controller,
  index,
}: {
  controller: ConsoleSearchController;
  index: number;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  const matches = state.matches
    .map((match, matchIndex) => ({ match, matchIndex }))
    .filter(({ match }) => match.index === index);
  if (!matches.length) return null;
  return (
    <span className="console-search-matches" aria-label={`${matches.length} matches in this message`}>
      {matches.map(({ match, matchIndex }) => (
        <mark
          key={`${match.start}-${match.end}-${matchIndex}`}
          className="console-search-highlight"
          data-active={state.activeIndex === matchIndex ? "" : undefined}
          aria-label={state.activeIndex === matchIndex ? "Current search match" : "Search match"}
        >
          {match.text || "Zero-width match"}
        </mark>
      ))}
    </span>
  );
}
