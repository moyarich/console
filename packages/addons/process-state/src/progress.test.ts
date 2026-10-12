import { describe, expect, it } from "vitest";
import {
  createProcessStateController,
  createProcessStateParser,
} from "./index";

describe("OSC 9;4 native progress", () => {
  const setup = () => {
    const controller = createProcessStateController();
    const parser = createProcessStateParser(controller);
    const write = (data: string) =>
      parser.parse({ output: { data } } as Parameters<typeof parser.parse>[0]);
    return { controller, parser, write };
  };

  it("clamps percentages and preserves normal text", () => {
    const { controller, write } = setup();
    const output = write("hello\x1b]9;4;1;999\x07world");
    expect(output?.data).toBe("helloworld");
    expect(controller.getState().progress).toEqual({ state: 1, value: 100 });
  });

  it("retains progress during indeterminate, paused and error states", () => {
    const { controller, write } = setup();
    write("\x1b]9;4;1;42\x07");
    write("\x1b]9;4;3\x07");
    expect(controller.getState().progress).toEqual({ state: 3, value: 42 });
    write("\x1b]9;4;4;0\x07");
    expect(controller.getState().progress).toEqual({ state: 4, value: 42 });
    write("\x1b]9;4;2;0\x07");
    expect(controller.getState().progress).toEqual({ state: 2, value: 42 });
    write("\x1b]9;4;0\x07");
    expect(controller.getState().progress).toEqual({ state: 0, value: 0 });
  });

  it("supports split OSC and ST termination", () => {
    const { controller, write } = setup();
    expect(write("\x1b]9;4;1;")?.data).toBe("");
    expect(write("64\x1b\\done")?.data).toBe("done");
    expect(controller.getState().progress).toEqual({ state: 1, value: 64 });
  });

  it("does not apply invalid state or non-decimal percentages", () => {
    const { controller, write } = setup();
    write("\x1b]9;4;5;20\x07");
    write("\x1b]9;4;1;1x\x07");
    expect(controller.getState().progress).toBeUndefined();
  });

  it("resets stored progress and notifies listeners", () => {
    const { controller, parser, write } = setup();
    let count = 0;
    const unsubscribe = controller.subscribe(() => count++);
    write("\x1b]9;4;1;22\x07");
    parser.reset?.();
    expect(controller.getState().progress).toBeUndefined();
    expect(count).toBe(2);
    unsubscribe();
    write("\x1b]9;4;1;55\x07");
    expect(count).toBe(2);
  });
});
