import { describe, expect, it } from "vitest";
import { findConsoleSearchMatches } from "@moyarich/console-addon-search";

const entries = [
  { id: "first", text: "Error error: connection error" },
  { id: "second", text: "No errors here" },
];

describe("console search", () => {
  it("finds every occurrence instead of just the first match per row", () => {
    const result = findConsoleSearchMatches(entries, "error");
    expect(result.matches.filter((match) => match.id === "first")).toHaveLength(
      3,
    );
  });
  it("supports case sensitivity", () => {
    expect(
      findConsoleSearchMatches(entries, "Error", { caseSensitive: true })
        .matches,
    ).toHaveLength(1);
  });
  it("enforces whole-word matching across all occurrences", () => {
    const result = findConsoleSearchMatches(entries, "error", {
      wholeWord: true,
    });
    expect(result.matches).toHaveLength(3);
  });
  it("rejects malformed regex without throwing", () => {
    const result = findConsoleSearchMatches(entries, "(", { regex: true });
    expect(result.error).toBeTruthy();
    expect(result.matches).toEqual([]);
  });
  it("handles zero-width regex patterns without looping forever", () => {
    expect(
      findConsoleSearchMatches([{ id: "x", text: "abc" }], "(?=b)", {
        regex: true,
      }).matches,
    ).toHaveLength(1);
  });
  it("does not return matches for an empty query", () => {
    expect(findConsoleSearchMatches(entries, "").matches).toEqual([]);
  });
});
