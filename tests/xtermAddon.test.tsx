import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Console } from "@moyarich/console";
import { createConsoleXtermAddon, xtermOutputRenderer, XtermOutput } from "@moyarich/console-addon-xterm";

describe("optional xterm renderer", () => {
  it("matches terminal mode only and preserves core fallback", () => {
    expect(xtermOutputRenderer.mode).toBe("terminal");
    expect(xtermOutputRenderer.render({ mode: "console", messages: [], renderDefault: () => null })).toBeUndefined();
    expect(renderToStaticMarkup(<Console mode="terminal" messages={["ready"]} />)).toContain("ready");
  });

  it("creates a distinct removable addon with no source mutation", () => {
    const addon = createConsoleXtermAddon();
    expect(addon.id).toBe("@moyarich/console-addon-xterm");
    const entries = [{ id: "1", data: "\u001b[31mhello\u001b[0m", stream: "stderr" as const }];
    const before = JSON.stringify(entries);
    const html = renderToStaticMarkup(<XtermOutput entries={entries} />);
    expect(html).toContain('aria-label="Terminal output"');
    expect(JSON.stringify(entries)).toBe(before);
  });
});
