import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsoleLinkedText } from "../packages/console/src/links";
import { ConsoleTextHighlightContext } from "../packages/console/src/textHighlights";
import { ConsoleStdout } from "@moyarich/console";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  type ConsoleTextHighlightProvider,
} from "@moyarich/console-core";
import {
  ConsoleSearchControls,
  createConsoleSearchAddon,
} from "@moyarich/console-addon-search";

describe("inline search highlighting", () => {
  const highlight: ConsoleTextHighlightProvider = {
    subscribe: () => () => {},
    getSnapshot: () => "error",
    getRanges: (text) => {
      const index = text.toLowerCase().indexOf("error");
      return index < 0 ? [] : [{ start: index, end: index + 5, active: true }];
    },
  };

  it("keeps links interactive while marking only the matching text", () => {
    const html = renderToStaticMarkup(
      <ConsoleTextHighlightContext.Provider value={highlight}>
        <ConsoleLinkedText
          text="Error https://example.com/error"
          context={{ mode: "console" }}
          links={[
            {
              text: "https://example.com/error",
              start: 6,
              end: 31,
              target: "https://example.com/error",
            },
          ]}
        />
      </ConsoleTextHighlightContext.Provider>,
    );
    expect(html).toContain('<mark class="console-search-highlight"');
    expect(html).toContain('href="https://example.com/error"');
    expect(html).toContain('data-active=""');
    expect(html).not.toContain("undefined");
  });

  it("preserves terminal ANSI styles while highlighting visible text", () => {
    const html = renderToStaticMarkup(
      <ConsoleTextHighlightContext.Provider value={highlight}>
        <ConsoleStdout
          entries={[{ id: "ansi", data: "\u001b[31merror\u001b[0m ready" }]}
        />
      </ConsoleTextHighlightContext.Provider>,
    );
    expect(html).toContain("<mark");
    expect(html).toContain("error");
    expect(html).toContain("style=");
    expect(html).not.toContain("\u001b[31m");
  });

  it("restores unmodified rendering when no matches are provided", () => {
    const html = renderToStaticMarkup(
      <ConsoleLinkedText text="error" context={{ mode: "console" }} />,
    );
    expect(html).toContain("error");
    expect(html).not.toContain("<mark");
  });

  it("indexes nested structured values and strips ANSI codes from terminal matches", () => {
    const manager = createConsoleAddonManager();
    let snapshot: ReturnType<
      import("@moyarich/console-core").ConsoleDataService["getSnapshot"]
    > = {
      mode: "console",
      all: [
        { id: "nested", method: "log", depth: 0, data: [{ status: "needle" }] },
      ],
      visible: [
        { id: "nested", method: "log", depth: 0, data: [{ status: "needle" }] },
      ],
    };
    manager.services.provide(consoleServices.data, {
      getSnapshot: () => snapshot,
      subscribe: () => ({ dispose() {} }),
    });
    const addon = createConsoleSearchAddon();
    manager.load(addon);
    addon.controller.setQuery("needle");
    expect(
      addon.controller.getState().matches.map((match) => match.id),
    ).toEqual(["nested"]);
    const processEntry = { id: "terminal", data: "\u001b[31mneedle\u001b[0m" };
    snapshot = {
      mode: "terminal",
      rawEntries: [processEntry],
      all: [
        {
          entry: processEntry,
          output: { data: processEntry.data, metadata: {} },
        },
      ],
      visible: [
        {
          entry: processEntry,
          output: { data: processEntry.data, metadata: {} },
        },
      ],
    };
    addon.controller.refresh();
    expect(
      addon.controller.getState().matches.map((match) => match.id),
    ).toEqual(["terminal"]);
    expect(processEntry.data).toContain("\u001b");
  });

  it("provides named native keyboard controls and a polite match status", () => {
    const addon = createConsoleSearchAddon();
    const html = renderToStaticMarkup(
      <ConsoleSearchControls controller={addon.controller} />,
    );
    expect(html).toContain('type="search"');
    expect(html).toContain('aria-label="Search console output"');
    expect(html).toContain('aria-label="Previous search result"');
    expect(html).toContain('aria-label="Next search result"');
    expect(html).toContain('aria-live="polite"');
  });

  it("search addon registers a reactive provider that clears highlights", () => {
    const manager = createConsoleAddonManager();
    const addon = createConsoleSearchAddon();
    manager.services.provide(consoleServices.data, {
      getSnapshot: () => ({ mode: "console", all: [], visible: [] }),
      subscribe: () => ({ dispose() {} }),
    });
    manager.load(addon);
    const provider = manager.extensions.getAll(
      consoleExtensionPoints.textHighlightProvider,
    )[0]!;
    addon.controller.setQuery("error");
    expect(
      provider.getRanges("an error occurred", {
        mode: "console",
        text: "an error occurred",
      }),
    ).toHaveLength(1);
    addon.controller.setQuery("");
    expect(
      provider.getRanges("an error occurred", {
        mode: "console",
        text: "an error occurred",
      }),
    ).toEqual([]);
  });
});
