const CONTEXT_MENU_VIEWPORT_MARGIN = 8;

/**
 * Clamps context-menu coordinates so the measured menu remains inside the viewport.
 *
 * @param clientX Requested horizontal viewport coordinate.
 * @param clientY Requested vertical viewport coordinate.
 * @param width Measured menu width in CSS pixels.
 * @param height Measured menu height in CSS pixels.
 * @returns Safe viewport coordinates for positioning the menu.
 */
export function getMenuPosition(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
) {
  const maxX = Math.max(
    CONTEXT_MENU_VIEWPORT_MARGIN,
    window.innerWidth - width - CONTEXT_MENU_VIEWPORT_MARGIN,
  );
  const maxY = Math.max(
    CONTEXT_MENU_VIEWPORT_MARGIN,
    window.innerHeight - height - CONTEXT_MENU_VIEWPORT_MARGIN,
  );

  return {
    x: Math.min(Math.max(CONTEXT_MENU_VIEWPORT_MARGIN, clientX), maxX),
    y: Math.min(Math.max(CONTEXT_MENU_VIEWPORT_MARGIN, clientY), maxY),
  };
}
