import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  createConsoleAddonManager,
} from "@moyarich/console";
import {
  CONSOLE_MARKDOWN_ADDON_ID,
  MarkdownValue,
  createConsoleMarkdownAddon,
  hasMarkdown,
} from "@moyarich/console-addon-markdown";

describe("@moyarich/console-addon-markdown", () => {
  it("detects structural and inline Markdown", () => {
    expect(hasMarkdown("## Build summary")).toBe(true);
    expect(hasMarkdown("**Build complete**")).toBe(true);
    expect(
      hasMarkdown("| Package | Status |\n| --- | --- |\n| console | ✅ |"),
    ).toBe(true);
  });

  it("leaves ordinary text and bare URLs plain", () => {
    expect(hasMarkdown("Build complete")).toBe(false);
    expect(hasMarkdown("Line one\nLine two")).toBe(false);
    expect(hasMarkdown("https://github.com/moyarich/console")).toBe(false);
    expect(hasMarkdown("<https://github.com/moyarich/console>")).toBe(false);
  });

  it("renders GitHub Flavored Markdown", () => {
    const markup = renderToStaticMarkup(
      <MarkdownValue
        text={[
          "## Release dry run",
          "",
          "| Package | Status |",
          "| --- | --- |",
          "| console | ✅ |",
          "",
          "- Current: `0.1.0`",
          "- Next: `0.1.1`",
        ].join("\n")}
      />,
    );

    expect(markup).toContain("<h2>Release dry run</h2>");
    expect(markup).toContain("<table>");
    expect(markup).toContain("<code>0.1.0</code>");
  });

  it("registers one string value renderer through the addon API", () => {
    const manager = createConsoleAddonManager();
    const addon = createConsoleMarkdownAddon();

    expect(addon.id).toBe(CONSOLE_MARKDOWN_ADDON_ID);

    manager.load(addon);

    const renderers = manager.extensions.getAll(
      consoleExtensionPoints.valueRenderer,
    );

    expect(renderers).toHaveLength(1);
    expect(
      renderers[0]!.match?.({
        value: "# Summary",
        type: "string",
        depth: 0,
        renderDefault: () => undefined,
      }),
    ).toBe(true);
    expect(
      renderers[0]!.match?.({
        value: "Build complete",
        type: "string",
        depth: 0,
        renderDefault: () => undefined,
      }),
    ).toBe(false);
  });
});
