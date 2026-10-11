/** Stable package-qualified identity for the resizable frame addon. */
export const RESIZABLE_CONSOLE_ADDON_ID = "@moyarich/console-addon-resizable";

import { ResizableConsoleFrame } from "./components/ResizableConsoleFrame/ResizableConsoleFrame";
export { resolveConsoleResizeAxes } from "./components/ResizableConsoleFrame/ResizableConsoleFrame";
export type {
  ConsoleResizeDirection,
  ConsoleResizeEdge,
  ConsoleResizeSize,
  ResizableConsoleAddonOptions,
} from "./components/ResizableConsoleFrame/ResizableConsoleFrame";
import type { ResizableConsoleAddonOptions } from "./components/ResizableConsoleFrame/ResizableConsoleFrame";
import type { ReactNode } from "react";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleFrameDecorator,
} from "@moyarich/console-core";

/**
 * Creates a first-party frame-resizing addon.
 *
 * The addon contributes a generic frame decorator and leaves message/output
 * rendering, viewport state, and host layout ownership unchanged.
 */
export function createResizableConsoleAddon(
  options: ResizableConsoleAddonOptions = {},
): ConsoleAddon {
  const decorator: ConsoleFrameDecorator = {
    render(context) {
      return (
        <ResizableConsoleFrame mode={context.mode} options={options}>
          {context.renderDefault() as ReactNode}
        </ResizableConsoleFrame>
      );
    },
  };

  return {
    id: RESIZABLE_CONSOLE_ADDON_ID,

    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.frameDecorator,
        decorator,
        {
          id: `${RESIZABLE_CONSOLE_ADDON_ID}:frame`,
        },
      );
    },
  };
}
