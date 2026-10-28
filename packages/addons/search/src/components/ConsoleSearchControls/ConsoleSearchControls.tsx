import { useConsoleAddonMessages } from "@moyarich/console";
import { useSyncExternalStore } from "react";
import type { ConsoleSearchController } from "../../index";
import "./ConsoleSearchControls.css";

export function ConsoleSearchControls({
  controller,
}: {
  controller: ConsoleSearchController;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  const count = state.matches.length;
  const t = useConsoleAddonMessages();
  return (
    <section className="console-search-controls" aria-label={t.search}>
      <label>
        <span className="console-search-controls-label">{t.searchOutput}</span>
        <input
          type="search"
          value={state.query}
          onChange={(event) => controller.setQuery(event.target.value)}
          aria-label={t.searchConsoleOutput}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!state.options.caseSensitive}
          onChange={(event) =>
            controller.setOptions({
              ...state.options,
              caseSensitive: event.target.checked,
            })
          }
        />{" "}
        {t.caseSensitive}
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!state.options.wholeWord}
          onChange={(event) =>
            controller.setOptions({
              ...state.options,
              wholeWord: event.target.checked,
            })
          }
        />{" "}
        {t.wholeWord}
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!state.options.regex}
          onChange={(event) =>
            controller.setOptions({
              ...state.options,
              regex: event.target.checked,
            })
          }
        />{" "}
        {t.regex}
      </label>
      <span role="status" aria-live="polite">
        {count === 0
          ? t.noMatches
          : t.matchCount.replace("{current}", String(state.activeIndex + 1)).replace("{total}", String(count))}
      </span>
      <button
        type="button"
        onClick={() => controller.previous()}
        disabled={!count}
        aria-label={t.previousResult}
      >
        {t.previous}
      </button>
      <button
        type="button"
        onClick={() => controller.next()}
        disabled={!count}
        aria-label={t.nextResult}
      >
        {t.next}
      </button>
      {state.error && <span role="alert">{state.error}</span>}
    </section>
  );
}
