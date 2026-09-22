/** Options used when scrolling a logical console message into view. */
export interface ConsoleScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

/** Stable imperative navigation surface shared by hosts and addons. */
export interface ConsoleViewportService {
  scrollToTop(): void;
  scrollToBottom(): void;
  scrollToMessage(id: string, options?: ConsoleScrollOptions): boolean;
  isAtBottom(): boolean;
  isAtTop(): boolean;
  focus(): void;
}

export interface ConsoleViewportController extends ConsoleViewportService {
  updateFromScroll(): void;
  scrollToBottomIfPinned(): void;
}

const AUTO_SCROLL_THRESHOLD = 24;

function distanceFromBottom(surface: HTMLElement): number {
  return surface.scrollHeight - surface.scrollTop - surface.clientHeight;
}

function findMessageElement(
  surface: HTMLElement,
  id: string,
): HTMLElement | undefined {
  return Array.from(
    surface.querySelectorAll<HTMLElement>("[data-console-message-id]"),
  ).find((element) => element.dataset.consoleMessageId === id);
}

/**
 * Creates the shared viewport implementation used by the public Console ref
 * and the addon viewport service.
 */
export function createConsoleViewportController(
  getSurface: () => HTMLElement | null,
): ConsoleViewportController {
  let pinnedToBottom = true;

  const isAtBottom = () => {
    const surface = getSurface();

    return surface
      ? distanceFromBottom(surface) <= AUTO_SCROLL_THRESHOLD
      : false;
  };

  return {
    scrollToTop() {
      const surface = getSurface();
      if (!surface) return;

      pinnedToBottom = false;
      surface.scrollTop = 0;
    },

    scrollToBottom() {
      const surface = getSurface();
      if (!surface) return;

      surface.scrollTop = surface.scrollHeight;
      pinnedToBottom = true;
    },

    scrollToMessage(id, options) {
      const surface = getSurface();
      if (!surface) return false;

      const target = findMessageElement(surface, id);
      if (!target) return false;

      pinnedToBottom = false;
      target.scrollIntoView({
        behavior: options?.behavior,
        block: options?.block ?? "nearest",
        inline: options?.inline ?? "nearest",
      });
      pinnedToBottom = isAtBottom();

      return true;
    },

    isAtBottom,

    isAtTop() {
      const surface = getSurface();
      return surface ? surface.scrollTop <= 0 : false;
    },

    focus() {
      getSurface()?.focus();
    },

    updateFromScroll() {
      pinnedToBottom = isAtBottom();
    },

    scrollToBottomIfPinned() {
      if (!pinnedToBottom) return;

      const surface = getSurface();
      if (!surface) return;

      surface.scrollTop = surface.scrollHeight;
    },
  };
}
