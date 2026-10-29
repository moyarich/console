import type { AddonTranslations } from "./localization";
export { resolveAddonMessages } from "./localization";
export type { AddonTranslations } from "./localization";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputRenderer,
} from "@moyarich/console-core";
import { XtermOutput } from "./XtermOutput";

export const CONSOLE_XTERM_ADDON_ID = "@moyarich/console-addon-xterm";

export const xtermOutputRenderer: ConsoleOutputRenderer = {
  mode: "terminal",
  render(context) {
    if (context.mode !== "terminal") return undefined;
    return <XtermOutput entries={context.entries} />;
  },
};

export function createConsoleXtermAddon(
  options: { locale?: string; translations?: AddonTranslations } = {},
): ConsoleAddon {
  return {
    id: CONSOLE_XTERM_ADDON_ID,
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        {
          ...xtermOutputRenderer,
          render(context) {
            if (context.mode !== "terminal") return undefined;
            return <XtermOutput entries={context.entries} {...options} />;
          },
        },
        {
          id: `${CONSOLE_XTERM_ADDON_ID}:output-renderer`,
        },
      );
    },
  };
}

export { XtermOutput, isAppendOnly } from "./XtermOutput";
