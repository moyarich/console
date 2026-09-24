import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  resolveConsoleProcessOutput,
  type ConsoleProcessControlParser,
} from "@moyarich/console";

describe("consoleExtensionPoints", () => {
  it("exposes the complete generic extension surface", () => {
    expect(Object.keys(consoleExtensionPoints)).toEqual([
      "processControlParser",
      "processOutputProcessor",
      "structuredOutputParser",
      "linkProvider",
      "outputRenderer",
      "frameDecorator",
      "emptyStateRenderer",
      "panelElement",
      "messageFilter",
      "messageRenderer",
      "messageDecoration",
      "messageTextProvider",
      "valueRenderer",
      "keyboardShortcut",
      "panelAction",
      "contextMenuAction",
      "messageAction",
    ]);
  });

  it("runs stateful process-control parsing before line normalization", () => {
    let buffered = "";
    const parser: ConsoleProcessControlParser = {
      reset() {
        buffered = "";
      },
      parse({ output }) {
        const value = buffered + output.data;

        if (value.startsWith("[[cwd:") && !value.includes("]]")) {
          buffered = value;
          return { omit: true };
        }

        const match = /^\[\[cwd:([^\]]+)\]\](.*)$/s.exec(value);

        if (!match) {
          buffered = "";
          return { data: value };
        }

        buffered = "";

        return {
          data: match[2] ?? "",
          events: [{ type: "cwd", data: { cwd: match[1] } }],
        };
      },
    };

    const resolved = resolveConsoleProcessOutput(
      ["[[cwd:/work", "space]]ready\n"],
      [],
      [parser],
    );

    expect(resolved.controlEvents).toEqual([
      { type: "cwd", data: { cwd: "/workspace" } },
    ]);
    expect(resolved.entries).toHaveLength(1);
    expect(resolved.entries[0]?.output.data).toBe("ready");
  });
});
