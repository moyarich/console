import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createConsoleMetadataAddon, formatMetadataTimestamp, getMetadataLabels } from "@moyarich/console-addon-metadata";

const fallback = () => "original";
const message = { id: "m", method: "log" as const, depth: 0, data: ["log"], source: "preview", timestamp: 1000 };

describe("optional metadata addon", () => {
  it("keeps source and timestamps independently configurable", () => {
    const context = { mode: "console" as const, message, index: 0, renderDefault: fallback };
    expect(getMetadataLabels(context, { timestamp: false })).toEqual({ source: "preview", timestamp: undefined });
    expect(getMetadataLabels(context, { source: false, formatTimestamp: () => "custom" })).toEqual({ source: undefined, timestamp: "custom" });
  });

  it("handles missing metadata without inventing labels", () => {
    const context = { mode: "terminal" as const, entry: { data: "raw" }, index: 0, renderDefault: fallback };
    expect(getMetadataLabels(context)).toEqual({ source: undefined, timestamp: undefined });
  });

  it("reads equivalent terminal process metadata", () => {
    const context = { mode: "terminal" as const, entry: { data: "raw", metadata: { source: "runner", timestamp: 1000 } }, index: 0, renderDefault: fallback };
    expect(getMetadataLabels(context, { formatTimestamp: () => "T" })).toEqual({ source: "runner", timestamp: "T" });
  });

  it("formats deterministic relative timestamps", () => {
    expect(formatMetadataTimestamp(1000, "relative", 6000)).toBe("5s ago");
    expect(formatMetadataTimestamp(6000, "relative", 1000)).toBe("in 5s");
  });

  it("registers a removable entry decorator and does not change source", () => {
    const contributions: unknown[] = [];
    const addon = createConsoleMetadataAddon({ formatTimestamp: () => "formatted" });
    addon.activate({ extensions: { register(_point: unknown, contribution: unknown) { contributions.push(contribution); } } } as Parameters<typeof addon.activate>[0]);
    expect(contributions).toHaveLength(1);
    const decorator = contributions[0] as { render(context: unknown): unknown };
    const original = JSON.stringify(message);
    const rendered = decorator.render({ mode: "console", message, index: 0, renderDefault: fallback });
    expect(renderToStaticMarkup(rendered as React.ReactElement)).toContain("formatted");
    expect(JSON.stringify(message)).toBe(original);
  });
});
