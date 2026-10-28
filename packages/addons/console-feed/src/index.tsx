import type { AddonTranslations } from "./localization";
export { resolveAddonMessages } from "./localization";
export type { AddonTranslations } from "./localization";
import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputRenderer,
} from "@moyarich/console-core";
import type { ConsoleMessageData } from "@moyarich/console";
import { ConsoleFeed } from "./ConsoleFeed";
import "./ConsoleFeed.css";

export const CONSOLE_FEED_ADDON_ID = "@moyarich/console-addon-console-feed";

/** A removable output renderer; source messages are never modified. */
export const consoleFeedOutputRenderer: ConsoleOutputRenderer = {
  mode: "console",
  render(context) {
    if (context.mode !== "console") return undefined;
    return <ConsoleFeed messages={context.messages} />;
  },
};

export function createConsoleFeedAddon(options: { locale?: string; translations?: AddonTranslations } = {}): ConsoleAddon {
  return {
    id: CONSOLE_FEED_ADDON_ID,
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        { ...consoleFeedOutputRenderer, render(context) {
          if (context.mode !== "console") return undefined;
          return <ConsoleFeed messages={context.messages} {...options} />;
        } },
        {
          id: `${CONSOLE_FEED_ADDON_ID}:output-renderer`,
        },
      );
    },
  };
}

export { ConsoleFeed } from "./ConsoleFeed";
export type { ConsoleMessageData };
