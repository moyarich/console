import {
  resolveAddonMessages,
  type AddonTranslations,
} from "../../localization";
import { useId, useSyncExternalStore } from "react";
import type { ConsoleSearchController } from "../../index";
import "./ConsoleSearchControls.css";

export function ConsoleSearchControls({
  controller,
  locale = "en",
  translations,
}: {
  controller: ConsoleSearchController;
  locale?: string;
  translations?: AddonTranslations;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  const errorId = useId();
  const count = state.matches.length;
  const t = resolveAddonMessages(locale, translations);
  const selectFirstMatch = () => {
    const next = controller.getState();
    if (next.matches.length && next.activeIndex < 0) controller.next();
  };
  return (
    <section className="console-search-controls" aria-label={t.search}>
      <div className="console-search-controls-row">
        <label className="console-search-controls-field">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            placeholder={t.searchOutput}
            aria-invalid={!!state.error}
            aria-describedby={state.error ? errorId : undefined}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                if (event.shiftKey) controller.previous();
                else controller.next();
              }
            }}
            value={state.query}
            onChange={(event) => {
              controller.setQuery(event.target.value);
              selectFirstMatch();
            }}
            aria-label={t.searchConsoleOutput}
          />
        </label>
        <span role="status" aria-live="polite">
          {!state.query
            ? ""
            : count === 0
              ? t.noMatches
              : t.matchCount
                  .replace("{current}", String(state.activeIndex + 1))
                  .replace("{total}", String(count))}
        </span>
        <button
          type="button"
          onClick={() => controller.previous()}
          disabled={!count}
          aria-label={t.previousResult}
          title={t.previousResult}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="button"
          onClick={() => controller.next()}
          disabled={!count}
          aria-label={t.nextResult}
          title={t.nextResult}
        >
          <span aria-hidden="true">↓</span>
        </button>
      </div>
      <div className="console-search-controls-options">
        <label>
          <input
            type="checkbox"
            checked={!!state.options.caseSensitive}
            onChange={(event) => {
              controller.setOptions({
                ...state.options,
                caseSensitive: event.target.checked,
              });
              selectFirstMatch();
            }}
          />{" "}
          {t.caseSensitive}
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!state.options.wholeWord}
            onChange={(event) => {
              controller.setOptions({
                ...state.options,
                wholeWord: event.target.checked,
              });
              selectFirstMatch();
            }}
          />{" "}
          {t.wholeWord}
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!state.options.regex}
            onChange={(event) => {
              controller.setOptions({
                ...state.options,
                regex: event.target.checked,
              });
              selectFirstMatch();
            }}
          />{" "}
          {t.regex}
        </label>
      </div>
      {state.error && (
        <span
          className="console-search-controls-error"
          id={errorId}
          role="alert"
        >
          {state.error}
        </span>
      )}
    </section>
  );
}
