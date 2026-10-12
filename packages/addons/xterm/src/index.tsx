import { consoleExtensionPoints, type ConsoleAddon, type ConsoleOutputRenderer } from "@moyarich/console-core";
import { XtermOutput } from "./XtermOutput";

export const CONSOLE_XTERM_ADDON_ID = "@moyarich/console-addon-xterm";

export const xtermOutputRenderer: ConsoleOutputRenderer = {
  mode: "terminal",
  render(context) {
    if (context.mode !== "terminal") return undefined;
    return <XtermOutput entries={context.entries} />;
  },
};

export function createConsoleXtermAddon(): ConsoleAddon {
  return {
    id: CONSOLE_XTERM_ADDON_ID,
    activate(host) {
      host.extensions.register(consoleExtensionPoints.outputRenderer, xtermOutputRenderer, {
        id: `${CONSOLE_XTERM_ADDON_ID}:output-renderer`,
      });
    },
  };
}

export { XtermOutput } from "./XtermOutput";
