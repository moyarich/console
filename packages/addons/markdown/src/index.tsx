import {
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleValueRenderer,
} from "@moyarich/console-core";
import {
  MarkdownValue,
  hasMarkdown,
} from "./components/MarkdownValue/MarkdownValue";
export {
  MarkdownValue,
  hasMarkdown,
} from "./components/MarkdownValue/MarkdownValue";

/** Stable package-qualified identity for the Markdown addon. */
export const CONSOLE_MARKDOWN_ADDON_ID = "@moyarich/console-addon-markdown";

/** Value renderer contributed by the first-party Markdown addon. */
export const markdownValueRenderer: ConsoleValueRenderer = {
  type: "string",
  match: ({ value }) => typeof value === "string" && hasMarkdown(value),
  render: ({ value }) =>
    typeof value === "string" ? <MarkdownValue text={value} /> : undefined,
};

/** Creates an addon that automatically renders detected Markdown strings. */
export function createConsoleMarkdownAddon(): ConsoleAddon {
  return {
    id: CONSOLE_MARKDOWN_ADDON_ID,
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.valueRenderer,
        markdownValueRenderer,
        { id: `${CONSOLE_MARKDOWN_ADDON_ID}:value-renderer` },
      );
    },
  };
}
