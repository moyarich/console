import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleOutputRenderer,
} from "@moyarich/console-core";
import type { ConsoleMessageData } from "@moyarich/console";
import type { ReactNode } from "react";
import { ConsoleFeed } from "./ConsoleFeed";
import "./ConsoleFeed.css";

export const CONSOLE_FEED_ADDON_ID = "@moyarich/console-addon-console-feed";

/** A removable output renderer; source messages are never modified. */
export const consoleFeedOutputRenderer: ConsoleOutputRenderer<ReactNode> = {
  mode: "console",
  render(context) {
    if (context.mode !== "console") return undefined;
    return <ConsoleFeed messages={context.messages} />;
  },
};

export function createConsoleFeedAddon(): ConsoleAddon {
  return {
    id: CONSOLE_FEED_ADDON_ID,
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        consoleFeedOutputRenderer,
        {
          id: `${CONSOLE_FEED_ADDON_ID}:output-renderer`,
        },
      );
    },
  };
}

export { ConsoleFeed } from "./ConsoleFeed";
export type { ConsoleMessageData };
