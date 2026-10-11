import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ConsoleSearchHighlight,
  type ConsoleSearchController,
} from "@moyarich/console-addon-search";

const matches = [
  { id: "line", index: 0, text: "Error", start: 0, end: 5 },
  { id: "line", index: 0, text: "error", start: 6, end: 11 },
  { id: "other", index: 1, text: "error", start: 0, end: 5 },
];

function controller(activeIndex: number): ConsoleSearchController {
  const state = { query: "error", options: {}, matches, activeIndex };
  return {
    getState: () => state,
    subscribe: () => () => {},
    setQuery: () => {},
    setOptions: () => {},
    refresh: () => {},
    next: () => undefined,
    previous: () => undefined,
  };
}

describe("search match badges", () => {
  it("renders all matching occurrences and marks only the active occurrence", () => {
    const html = renderToStaticMarkup(
      <ConsoleSearchHighlight controller={controller(1)} index={0} />,
    );
    expect(html.match(/class="console-search-highlight"/g) ?? []).toHaveLength(
      2,
    );
    expect(html.match(/data-active=""/g) ?? []).toHaveLength(1);
    expect(html).toContain("2 matches in this message");
  });

  it("renders no badge for messages without matches", () => {
    expect(
      renderToStaticMarkup(
        <ConsoleSearchHighlight controller={controller(0)} index={99} />,
      ),
    ).toBe("");
  });
});
