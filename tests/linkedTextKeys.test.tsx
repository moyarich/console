import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConsoleLinkedText } from "../packages/console/src/links";
import { ConsoleTextHighlightContext } from "../packages/console/src/textHighlights";

describe("ConsoleLinkedText keys", () => {
  it("does not warn about missing keys between links", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        <ConsoleLinkedText
          text="before example after"
          context={{ mode: "console" }}
          links={[{ start: 7, end: 14, text: "example", target: "/example" }]}
        />,
      );
      expect(html).toContain('href="/example"');
      expect(html).toContain("before ");
      expect(html).toContain(" after");
      expect(error.mock.calls.flat().join(" ")).not.toContain('unique "key"');
    } finally {
      error.mockRestore();
    }
  });

  it("does not warn about missing keys in highlighted text", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(
        <ConsoleTextHighlightContext.Provider
          value={{
            subscribe: () => () => {},
            getSnapshot: () => "example",
            getRanges: () => [{ start: 7, end: 14 }],
          }}
        >
          <ConsoleLinkedText
            text="before example after"
            context={{ mode: "console" }}
          />
        </ConsoleTextHighlightContext.Provider>,
      );
      expect(html).toContain("console-search-highlight");
      expect(error.mock.calls.flat().join(" ")).not.toContain('unique "key"');
    } finally {
      error.mockRestore();
    }
  });
});
