import { useSyncExternalStore } from "react";
import type { ConsoleSearchController } from "../../index";
import "./ConsoleSearchControls.css";

export function ConsoleSearchControls({ controller }: { controller: ConsoleSearchController }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const count = state.matches.length;
  return (
    <section className="console-search-controls" aria-label="Console search">
      <label>
        <span className="console-search-controls-label">Search output</span>
        <input type="search" value={state.query} onChange={(event) => controller.setQuery(event.target.value)} aria-label="Search console output" />
      </label>
      <label><input type="checkbox" checked={!!state.options.caseSensitive} onChange={(event) => controller.setOptions({ ...state.options, caseSensitive: event.target.checked })} /> Case sensitive</label>
      <label><input type="checkbox" checked={!!state.options.wholeWord} onChange={(event) => controller.setOptions({ ...state.options, wholeWord: event.target.checked })} /> Whole word</label>
      <label><input type="checkbox" checked={!!state.options.regex} onChange={(event) => controller.setOptions({ ...state.options, regex: event.target.checked })} /> Regex</label>
      <span role="status" aria-live="polite">{count === 0 ? "No matches" : `${state.activeIndex + 1} of ${count} matches`}</span>
      <button type="button" onClick={() => controller.previous()} disabled={!count} aria-label="Previous search result">Previous</button>
      <button type="button" onClick={() => controller.next()} disabled={!count} aria-label="Next search result">Next</button>
      {state.error && <span role="alert">{state.error}</span>}
    </section>
  );
}
