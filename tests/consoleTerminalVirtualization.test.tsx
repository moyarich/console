import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console } from "@moyarich/console";

describe("terminal output virtualization", () => {
  const entries = Array.from({ length: 2000 }, (_, index) => `line ${index}`);

  it("keeps normal terminal output unchanged by default", () => {
    const html = renderToStaticMarkup(<Console mode="terminal" messages={entries.slice(0, 3)} />);
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
