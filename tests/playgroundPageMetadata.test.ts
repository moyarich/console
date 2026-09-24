import { describe, expect, it } from "vitest";
import {
  parsePageMeta,
  resolvePageTocOptions,
} from "../apps/playground/src/utils/pageMetadata";

describe("playground page metadata", () => {
  it("requires only a label and preserves additional frontmatter", () => {
    const metadata = {
      label: "console.log",
      futureField: "preserved",
      nested: { enabled: true },
    };

    expect(parsePageMeta(metadata, "./example/page.mdx")).toBe(metadata);
  });

  it("accepts page title, description, TOC, and sidebar outline options", () => {
    const metadata = {
      label: "Extension points",
      title: "Usage of Console Extension Points",
      description: "One runnable example for every extension point.",
      toc: {
        show: true,
        collapsible: true,
        defaultOpen: false,
        label: "Contents",
      },
      sidebarOutline: true,
      outlineLabelPrefix: "consoleExtensionPoints.",
    };

    expect(parsePageMeta(metadata, "./example/page.mdx")).toBe(metadata);
    expect(resolvePageTocOptions(metadata)).toEqual({
      show: true,
      collapsible: true,
      defaultOpen: false,
      label: "Contents",
    });
  });

  it("keeps page TOCs opt-in", () => {
    expect(resolvePageTocOptions({ label: "console.log" })).toEqual({
      show: false,
      collapsible: true,
      defaultOpen: true,
      label: "On this page",
    });

    expect(resolvePageTocOptions({ label: "console.log", toc: true })).toEqual({
      show: true,
      collapsible: true,
      defaultOpen: true,
      label: "On this page",
    });
  });

  it.each([
    [undefined, "Missing frontmatter metadata"],
    [{}, '"label" must be a non-empty string'],
    [{ label: "" }, '"label" must be a non-empty string'],
    [{ label: "Example", title: 42 }, '"title" must be a string'],
    [{ label: "Example", description: 42 }, '"description" must be a string'],
    [{ label: "Example", toc: "yes" }, '"toc" must be a boolean or object'],
    [
      { label: "Example", toc: { collapsible: "yes" } },
      '"toc.collapsible" must be a boolean',
    ],
    [{ label: "Example", toc: { label: 42 } }, '"toc.label" must be a string'],
    [
      { label: "Example", sidebarOutline: "yes" },
      '"sidebarOutline" must be a boolean',
    ],
  ])("rejects invalid metadata %#", (metadata, message) => {
    expect(() => parsePageMeta(metadata, "./example/page.mdx")).toThrow(
      message,
    );
  });
});
