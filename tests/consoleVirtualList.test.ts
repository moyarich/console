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
  it("keeps DOM window bounded for 100,000 retained rows", () => {
    const largeOffsets = Array.from(
      { length: 100001 },
      (_, index) => index * 32,
    );
    const range = getConsoleVirtualRange(largeOffsets, 1600000, 640, 6);
    expect(range.end - range.start).toBeLessThanOrEqual(32);
    expect(range.start).toBeGreaterThan(0);
    expect(range.end).toBeLessThan(100000);
  });

  it("returns an empty range for no retained rows", () => {
    expect(getConsoleVirtualRange([0], 0, 600)).toEqual({ start: 0, end: 0 });
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
