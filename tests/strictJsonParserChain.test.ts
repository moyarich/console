import { describe, expect, it } from "vitest";
import { parseStructuredOutput } from "../packages/console/src/utils/terminal/parseStructuredOutput";
import { strictJsonOutputParser } from "@moyarich/console";

const parse = (
  data: string,
  enableStrictJson = true,
  parsers: Parameters<typeof parseStructuredOutput>[4] = [],
) => parseStructuredOutput(data, { id: "source", data, stream: "stderr" }, 2, enableStrictJson, parsers, { stage: "processed" });

describe("ordered strict JSON structured-output parser", () => {
  it("exposes strict JSON as a reusable parser", () => {
    expect(strictJsonOutputParser({ text: '{"ok":true}', entry: '{"ok":true}', index: 0, metadata: {} })).toEqual({ ok: true });
    expect(strictJsonOutputParser({ text: "5", entry: "5", index: 0, metadata: {} })).toBeUndefined();
  });

  it("prefers supplied parsers over the built-in JSON fallback", () => {
    const order: string[] = [];
    const value = parse('{"a":1}', true, [
      (context) => { order.push("first"); expect(context.metadata.stage).toBe("processed"); throw new Error("isolated"); },
      (context) => { order.push("second"); expect(context.stream).toBe("stderr"); return { custom: true }; },
    ]);
    expect(value).toEqual({ custom: true });
    expect(order).toEqual(["first", "second"]);
  });

  it("falls through parser errors and undefined results to JSON", () => {
    expect(parse('{"ok":true}', true, [() => { throw new Error("failed"); }, () => undefined])).toEqual({ ok: true });
    expect(parse('[1,2]', true)).toEqual([1, 2]);
  });

  it("strips ANSI before each parser sees output", () => {
    expect(parse('\u001b[32m{"ok":true}\u001b[0m')).toEqual({ ok: true });
  });

  it("leaves malformed and scalar JSON as terminal text", () => {
    for (const text of ['{"a":', 'false', '42', '"hello"', '', '{"a":1} extra']) {
      expect(parse(text)).toBeUndefined();
    }
  });

  it("respects the opt-in convenience option", () => {
    expect(parse('{"ok":true}', false)).toBeUndefined();
    expect(parse('{"ok":true}', false, [() => ({ fromCustom: true })])).toEqual({ fromCustom: true });
  });
});
