import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Console } from "@moyarich/console";
import {
  createConsoleXtermAddon,
  xtermOutputRenderer,
  XtermOutput,
  isAppendOnly,
} from "@moyarich/console-addon-xterm";

const xtermCss = readFileSync(
  fileURLToPath(new URL("../packages/addons/xterm/src/XtermOutput.css", import.meta.url)),
  "utf8",
);

describe("optional xterm renderer", () => {
  it("keeps outer Console scroll fixed while xterm owns its scroll viewport", () => {
    expect(xtermCss).toContain(".console-panel .console-surface:has(.console-xterm-output)");
    expect(xtermCss).toMatch(/\.console-surface:has\(\.console-xterm-output\)[^{]*\{[^}]*min-height: 0;[^}]*overflow: hidden;/s);
    expect(xtermCss).toMatch(/\.console-xterm-output \{[^}]*flex: 1 1 0;[^}]*height: 0;/s);
    expect(xtermCss).toContain(".console-scroll-end-spacer");
  });

  it("matches terminal mode only and preserves core fallback", () => {
    expect(xtermOutputRenderer.mode).toBe("terminal");
    expect(
      xtermOutputRenderer.render({
        mode: "console",
        messages: [],
        renderDefault: () => null,
      }),
    ).toBeUndefined();
    expect(
      renderToStaticMarkup(<Console mode="terminal" messages={["ready"]} />),
    ).toContain("ready");
  });

  it("appends new output and replays replacements or clear operations", () => {
    const previous = [{ id: "a", data: "one" }];
    expect(
      isAppendOnly(previous, [...previous, { id: "b", data: "two" }]),
    ).toBe(true);
    expect(isAppendOnly(previous, [{ id: "a", data: "changed" }])).toBe(false);
    expect(isAppendOnly(previous, [])).toBe(false);
    expect(isAppendOnly([], [])).toBe(true);
  });

  it("creates a distinct removable addon with no source mutation", () => {
    const addon = createConsoleXtermAddon();
    expect(addon.id).toBe("@moyarich/console-addon-xterm");
    const entries = [
      { id: "1", data: "\u001b[31mhello\u001b[0m", stream: "stderr" as const },
    ];
    const before = JSON.stringify(entries);
    const html = renderToStaticMarkup(<XtermOutput entries={entries} />);
    expect(html).toContain('aria-label="Terminal output"');
    expect(JSON.stringify(entries)).toBe(before);
  });
});
