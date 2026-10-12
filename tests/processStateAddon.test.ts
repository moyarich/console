import { describe, expect, it } from "vitest";
import {
  createProcessStateController,
  createProcessStateParser,
} from "@moyarich/console-addon-process-state";

function decoder() {
  const controller = createProcessStateController();
  const parser = createProcessStateParser(controller);
  const write = (data: string) =>
    parser.parse({ output: { data, metadata: {} }, entry: data, index: 0 });
  return { controller, parser, write };
}

describe("OSC process-state parser", () => {
  it("parses progress and cwd across chunk boundaries while retaining text", () => {
    const { controller, write } = decoder();
    expect(write("before\x1b]9;4;1;7")).toMatchObject({ data: "before" });
    expect(write("5\x07after")).toMatchObject({ data: "after" });
    expect(controller.getState().progress).toEqual({ state: 1, value: 75 });
    write("\x1b]9;9;/workspace\x1b\\");
    expect(controller.getState().cwd).toBe("/workspace");
  });
  it("observes prompt, command, exit code, and notifications without invoking OS APIs", () => {
    const { controller, write } = decoder();
    for (const code of ["A", "B", "C", "D;23"])
      write("\x1b]133;" + code + "\x07");
    expect(controller.getState().command).toEqual({
      phase: "finished",
      exitCode: 23,
    });
    write("\x1b]777;notify;Build;Finished\x1b\\");
    expect(controller.getState().notifications).toEqual([
      { title: "Build", message: "Finished" },
    ]);
    expect(controller.getEvents().map((item) => item.type)).toEqual([
      "command",
      "command",
      "command",
      "command",
      "notification",
    ]);
  });
  it("preserves unknown/malformed sequences and source entries", () => {
    const { controller, write } = decoder();
    const validProgress = "\x1b]9;4;1;999\x07";
    expect(write(validProgress)).toMatchObject({ data: "", omit: true });
    expect(controller.getState().progress).toEqual({ state: 1, value: 100 });
    expect(controller.getEvents()).toHaveLength(1);
    const malformed = "\x1b]9;4;1;not-a-number\x07";
    expect(write(malformed)).toMatchObject({ data: malformed });
    expect(controller.getEvents()).toHaveLength(1);
    expect(write("\x1b]100;unknown\x07text")).toMatchObject({
      data: "\x1b]100;unknown\x07text",
    });
  });
  it("sanitizes untrusted notifications and resets state before replay", () => {
    const { controller, parser, write } = decoder();
    write("\x1b]777;notify;Hi;hello\x01world\x07");
    expect(controller.getState().notifications[0]?.message).toBe("helloworld");
    parser.reset?.();
    expect(controller.getEvents()).toHaveLength(0);
    expect(controller.getState().notifications).toHaveLength(0);
  });
});
