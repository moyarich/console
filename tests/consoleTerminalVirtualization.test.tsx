import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console } from "@moyarich/console";

describe("terminal output virtualization", () => {
  const entries = Array.from({ length: 2000 }, (_, index) => `line ${index}`);

  it("keeps normal terminal output unchanged by default", () => {
    const html = renderToStaticMarkup(
      <Console mode="terminal" messages={entries.slice(0, 3)} />,
    );
    expect(html).toContain("line 0");
    expect(html).not.toContain("data-console-virtual-list");
  });

  it("mounts a bounded terminal viewport for large output", () => {
    const html = renderToStaticMarkup(
      <Console mode="terminal" messages={entries} virtualize={true} />,
    );
    expect(html).toContain("data-console-virtual-list");
    expect(html).toContain("line 0");
    expect(html).not.toContain("line 1999");
  });
});

describe("structured output virtualization", () => {
  const messages = Array.from({ length: 10000 }, (_, index) => ({
    id: `message-${index}`,
    method: "log" as const,
    data: [`structured line ${index}`],
    depth: 0,
  }));

  it("renders a bounded row window without discarding logical history", () => {
    const html = renderToStaticMarkup(
      <Console messages={messages} virtualize />,
    );
    expect(html).toContain("data-console-virtual-list");
    expect(html).toContain("structured line 0");
    expect(html).not.toContain("structured line 9999");
    expect((html.match(/data-console-message-id=/g) ?? []).length).toBeLessThan(
      100,
    );
  });

  it("renders the complete small dataset with virtualization disabled", () => {
    const html = renderToStaticMarkup(
      <Console messages={messages.slice(0, 3)} />,
    );
    expect(html).toContain("structured line 2");
    expect(html).not.toContain("data-console-virtual-list");
  });
});
