import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useConsoleOutputPause } from "@moyarich/console";
import { countConsoleBufferedEntries } from "../packages/console/src/hooks/useConsoleOutputPause";

describe("paused Console output", () => {
  it("counts appended output without modifying retained source entries", () => {
    const source = ["one", "two", "three"];
    const frozen = source.slice(0, 2);
    expect(countConsoleBufferedEntries(frozen, source)).toBe(1);
    expect(frozen).toEqual(["one", "two"]);
    expect(source).toEqual(["one", "two", "three"]);
  });

  it("counts the entire new source when prior history was cleared or replaced", () => {
    expect(countConsoleBufferedEntries(["old"], [])).toBe(0);
    expect(countConsoleBufferedEntries(["old"], ["new"])).toBe(1);
    expect(countConsoleBufferedEntries(["old", "older"], ["new", "newer"])).toBe(2);
  });

  it("returns zero buffered entries when resumed baseline matches current", () => {
    const source = ["a", "b"];
    expect(countConsoleBufferedEntries(source, source)).toBe(0);
  });

  it("keeps live data visible when not paused", () => {
    function Example() {
      const view = useConsoleOutputPause(["a", "b"]);
      expect(view.paused).toBe(false);
      expect(view.displayed).toEqual(["a", "b"]);
      expect(view.bufferedCount).toBe(0);
      return <span>{view.displayed.length}</span>;
    }
    expect(renderToStaticMarkup(<Example />)).toContain(">2<");
  });
  it("starts in a paused state when requested", () => {
    function Example() {
      const view = useConsoleOutputPause(["a"], true);
      expect(view.paused).toBe(true);
      expect(view.displayed).toEqual(["a"]);
      expect(view.bufferedCount).toBe(0);
      return <span>Paused</span>;
    }
    expect(renderToStaticMarkup(<Example />)).toContain("Paused");
  });
});
