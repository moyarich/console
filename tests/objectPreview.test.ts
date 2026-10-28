import { describe, expect, it } from "vitest";
import { preview } from "../packages/console/src/utils/console/preview";

describe("collapsed object previews", () => {
  it("shows a shallow summary and an explicit remaining count", () => {
    expect(preview({ a: 1, b: [1, 2], c: { nested: true }, d: 4 })).toBe(
      "{ a: 1, b: Array(2), c: Object, +1 more }",
    );
    expect(preview([1, 2, 3, 4, 5])).toBe("[1, 2, 3, +2 more]");
  });
  it("summarizes long strings without changing the source", () => {
    const value = { output: "a".repeat(500) };
    expect(preview(value)).toBe("{ output: String(500) }");
    expect(value.output).toHaveLength(500);
  });
  it("does not invoke getters while generating a preview", () => {
    let reads = 0;
    const value = {
      get result() {
        reads++;
        throw new Error("Do not evaluate");
      },
    };
    expect(preview(value)).toBe("{ result: [Getter] }");
    expect(reads).toBe(0);
  });
});
