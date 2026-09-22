import type { MouseEvent } from "react";

/**
 * Resolves the viewport point for a context-menu event.
 *
 * Keyboard-triggered context-menu events commonly report zero coordinates, so
 * this helper falls back to a point inside the current target's bounds.
 *
 * @param event React context-menu mouse event.
 * @returns Viewport coordinates for opening the menu.
 */
export function getEventPoint(event: MouseEvent<HTMLElement>) {
  if (event.clientX !== 0 || event.clientY !== 0) {
    return { x: event.clientX, y: event.clientY };
  }

  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: rect.left + Math.min(24, rect.width / 2),
    y: rect.top + Math.min(24, rect.height / 2),
  };
}
