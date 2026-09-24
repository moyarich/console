import { describe, expect, it } from "vitest";
import { parsePageMeta } from "../apps/playground/src/utils/pageMetadata";

describe("playground page metadata", () => {
  it("requires only a label and preserves additional frontmatter", () => {
    const metadata = {
      label: "console.log",
      futureField: "preserved",
      nested: { enabled: true },
    };

    expect(parsePageMeta(metadata, "./example/page.mdx")).toBe(metadata);
  });

  it("accepts an optional description", () => {
    const metadata = {
      label: "console.log",
      description: "Render standard log messages.",
    };

    expect(parsePageMeta(metadata, "./example/page.mdx")).toBe(metadata);
  });

  it.each([
    [undefined, "Missing frontmatter metadata"],
    [{}, '"label" must be a non-empty string'],
    [{ label: "" }, '"label" must be a non-empty string'],
    [{ label: "Example", description: 42 }, '"description" must be a string'],
  ])("rejects invalid metadata %#", (metadata, message) => {
    expect(() => parsePageMeta(metadata, "./example/page.mdx")).toThrow(
      message,
    );
  });
});
