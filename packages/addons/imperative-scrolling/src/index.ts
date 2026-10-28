import { resolveAddonMessages, type AddonTranslations } from "./localization";
export { resolveAddonMessages } from "./localization";
export type { AddonTranslations } from "./localization";
import {
  consoleExtensionPoints,
  consoleServices,
  type ConsoleAddon,
  type ConsolePanelAction,
} from "@moyarich/console-core";

/** Stable package-qualified identity for the imperative scrolling addon. */
export const IMPERATIVE_SCROLLING_ADDON_ID =
  "@moyarich/console-addon-imperative-scrolling";

export interface ImperativeScrollingAddonOptions {
  locale?: string;
  translations?: AddonTranslations;
  /** Contribute a panel action that scrolls to the first logical row. @default true */
  scrollToTopAction?: boolean;
  /** Contribute a panel action that scrolls to the latest output. @default true */
  scrollToBottomAction?: boolean;
  /** Contribute a panel action that focuses the output viewport. @default true */
  focusAction?: boolean;
}

const actionRegistrationIds = {
  scrollToTop: `${IMPERATIVE_SCROLLING_ADDON_ID}:scroll-to-top`,
  scrollToBottom: `${IMPERATIVE_SCROLLING_ADDON_ID}:scroll-to-bottom`,
  focus: `${IMPERATIVE_SCROLLING_ADDON_ID}:focus`,
} as const;

function registerPanelAction(
  host: Parameters<ConsoleAddon["activate"]>[0],
  action: ConsolePanelAction,
): void {
  host.extensions.register(consoleExtensionPoints.panelAction, action, {
    id: action.id,
  });
}

/**
 * Creates the first-party imperative scrolling addon.
 *
 * The addon contributes standard panel actions and delegates all scrolling to
 * the core ConsoleViewportService. It does not own a second viewport model.
 */
export function createImperativeScrollingAddon(
  options: ImperativeScrollingAddonOptions = {},
): ConsoleAddon {
  const {
    scrollToTopAction = true,
    scrollToBottomAction = true,
    focusAction = true,
    locale = "en",
    translations,
  } = options;
  const labels = resolveAddonMessages(locale, translations);

  return {
    id: IMPERATIVE_SCROLLING_ADDON_ID,

    activate(host) {
      const viewport = host.services.require(consoleServices.viewport);

      if (scrollToTopAction) {
        registerPanelAction(host, {
          id: actionRegistrationIds.scrollToTop,
          label: labels.top,
          onSelect: () => viewport.scrollToTop(),
        });
      }

      if (scrollToBottomAction) {
        registerPanelAction(host, {
          id: actionRegistrationIds.scrollToBottom,
          label: labels.bottom,
          onSelect: () => viewport.scrollToBottom(),
        });
      }

      if (focusAction) {
        registerPanelAction(host, {
          id: actionRegistrationIds.focus,
          label: labels.focus,
          onSelect: () => viewport.focus(),
        });
      }
    },
  };
}
