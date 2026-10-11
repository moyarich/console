import { describe, expect, it, vi } from "vitest";
import { createConsoleViewportController } from "../packages/console/src/viewport";

describe("virtualized Console navigation", () => {
  it("scrolls to logical message IDs outside the mounted DOM", () => {
    const jump = vi.fn((id: string) => id === "offscreen-9000");
    const surface = {
      scrollHeight: 50000,
      scrollTop: 0,
      clientHeight: 400,
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => ({ scrollToConsoleMessage: jump })),
      focus: vi.fn(),
    };
    const viewport = createConsoleViewportController(() => surface as unknown as HTMLElement);
    expect(viewport.scrollToMessage("offscreen-9000")).toBe(true);
    expect(jump).toHaveBeenCalledWith("offscreen-9000");
    expect(viewport.scrollToMessage("missing")).toBe(false);
  });
});
