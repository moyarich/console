import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console } from "@moyarich/console";
import {
  ConsoleFeed,
  consoleFeedOutputRenderer,
  createConsoleFeedAddon,
} from "@moyarich/console-addon-console-feed";

const messages = [
  { id: "log", method: "log" as const, depth: 0, data: ["started"] },
  { id: "info", method: "info" as const, depth: 0, data: ["information"] },
  { id: "warn", method: "warn" as const, depth: 0, data: ["warning"] },
  { id: "error", method: "error" as const, depth: 0, data: ["failure"] },
];

describe("optional console feed addon", () => {
  it("renders severity labels without mutating source entries", () => {
    const before = JSON.stringify(messages);
    const html = renderToStaticMarkup(<ConsoleFeed messages={messages} />);
    expect(html).toContain('data-severity="warn"');
    expect(html).toContain('data-severity="error"');
    expect(html).toContain("information");
    expect(JSON.stringify(messages)).toBe(before);
  });

  it("renders only structured output and leaves terminal mode to the default renderer", () => {
    expect(consoleFeedOutputRenderer.mode).toBe("console");
    const html = renderToStaticMarkup(
      <Console mode="terminal" messages={["ready"]} />,
    );
    expect(html).not.toContain("console-feed-entry");
  });

  it("keeps built-in output when the addon is absent", () => {
    const html = renderToStaticMarkup(<Console messages={messages} />);
    expect(html).toContain("started");
    expect(html).not.toContain("console-feed-entry");
    expect(createConsoleFeedAddon().id).toBe(
      "@moyarich/console-addon-console-feed",
    );
  });

  it("renders circular object values without crashing", () => {
    const item: Record<string, unknown> = { status: "ok" };
    item.self = item;
    const html = renderToStaticMarkup(
      <ConsoleFeed messages={[{ method: "log", depth: 0, data: [item] }]} />,
    );
    expect(html).toContain("[Circular]");
  });
});
