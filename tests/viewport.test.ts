import { describe, expect, it, vi } from "vitest";
import { createConsoleViewportController } from "../packages/console/src/viewport";

interface FakeSurface {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
  focus: ReturnType<typeof vi.fn>;
  querySelectorAll: ReturnType<typeof vi.fn>;
}

function createSurface(): FakeSurface {
  return {
    scrollHeight: 1000,
    scrollTop: 800,
    clientHeight: 200,
    focus: vi.fn(),
    querySelectorAll: vi.fn(() => []),
  };
}

function asElement(surface: FakeSurface): HTMLElement {
  return surface as unknown as HTMLElement;
}

describe("console viewport service", () => {
  it("scrolls to the top and leaves auto-scroll unpinned", () => {
    const surface = createSurface();
    const viewport = createConsoleViewportController(() => asElement(surface));

    viewport.scrollToTop();

    expect(surface.scrollTop).toBe(0);
    expect(viewport.isAtTop()).toBe(true);

    surface.scrollHeight = 1200;
    viewport.scrollToBottomIfPinned();

    expect(surface.scrollTop).toBe(0);
  });

  it("scrolls to the bottom and restores pinned output", () => {
    const surface = createSurface();
    const viewport = createConsoleViewportController(() => asElement(surface));

    viewport.scrollToTop();
    viewport.scrollToBottom();

    expect(surface.scrollTop).toBe(1000);
    expect(viewport.isAtBottom()).toBe(true);

    surface.scrollHeight = 1200;
    viewport.scrollToBottomIfPinned();

    expect(surface.scrollTop).toBe(1200);
  });

  it("navigates to a logical message id without snapping back", () => {
    const surface = createSurface();
    let receivedOptions: ScrollIntoViewOptions | undefined;
    const target = {
      dataset: { consoleMessageId: "message-42" },
      scrollIntoView: vi.fn((options?: ScrollIntoViewOptions) => {
        receivedOptions = options;
        surface.scrollTop = 240;
      }),
    };
    surface.querySelectorAll.mockReturnValue([target]);

    const viewport = createConsoleViewportController(() => asElement(surface));

    expect(
      viewport.scrollToMessage("message-42", {
        behavior: "smooth",
        block: "center",
      }),
    ).toBe(true);
    expect(receivedOptions).toMatchObject({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    surface.scrollHeight = 1400;
    viewport.scrollToBottomIfPinned();

    expect(surface.scrollTop).toBe(240);
  });

  it("returns false when a logical message id is not rendered", () => {
    const surface = createSurface();
    const viewport = createConsoleViewportController(() => asElement(surface));

    expect(viewport.scrollToMessage("missing")).toBe(false);
  });

  it("uses the same bottom threshold for user and imperative state", () => {
    const surface = createSurface();
    const viewport = createConsoleViewportController(() => asElement(surface));

    surface.scrollTop = 780;
    viewport.updateFromScroll();
    expect(viewport.isAtBottom()).toBe(true);

    surface.scrollHeight = 1200;
    viewport.scrollToBottomIfPinned();
    expect(surface.scrollTop).toBe(1200);

    surface.scrollTop = 500;
    viewport.updateFromScroll();
    expect(viewport.isAtBottom()).toBe(false);

    surface.scrollHeight = 1400;
    viewport.scrollToBottomIfPinned();
    expect(surface.scrollTop).toBe(500);
  });

  it("remains safe across ref-style mount and unmount lifecycle", () => {
    let surface: FakeSurface | null = null;
    const viewport = createConsoleViewportController(() =>
      surface ? asElement(surface) : null,
    );

    expect(viewport.isAtTop()).toBe(false);
    expect(viewport.isAtBottom()).toBe(false);
    expect(viewport.scrollToMessage("message-1")).toBe(false);
    expect(() => viewport.focus()).not.toThrow();

    surface = createSurface();
    viewport.focus();
    expect(surface.focus).toHaveBeenCalledOnce();

    surface = null;
    expect(() => viewport.scrollToBottom()).not.toThrow();
    expect(() => viewport.scrollToTop()).not.toThrow();
  });
});
