import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useConsoleOutputPause } from "@moyarich/console";

describe("paused Console output", () => {
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
