import { describe, expect, it } from "vitest";
import { getConsoleVirtualRange } from "@moyarich/console";

describe("virtual console viewport", () => {
  const offsets = Array.from({ length: 10001 }, (_, index) => index * 24);

  it("mounts a bounded window from a 10,000-row logical history", () => {
    const range = getConsoleVirtualRange(offsets, 48000, 480, 6);
    expect(range.start).toBeGreaterThan(0);
    expect(range.end - range.start).toBeLessThan(40);
    expect(range.end).toBeLessThan(10000);
  });
  it("respects top and bottom boundaries", () => {
    const top = getConsoleVirtualRange(offsets, 0, 480, 6);
    const bottom = getConsoleVirtualRange(offsets, 239800, 480, 6);
    expect(top.start).toBe(0);
    expect(bottom.end).toBe(10000);
  });
  it("works with variable-height row offsets", () => {
    const range = getConsoleVirtualRange([0, 24, 120, 144, 190], 100, 50, 0);
    expect(range.start).toBe(1);
    expect(range.end).toBe(4);
  });
});
