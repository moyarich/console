import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import { createConsoleFilteringAddon } from "@moyarich/console-addon-filtering";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "release",
    method: "info",
    data: ["Release 42 is ready"],
    depth: 0,
    source: "ci",
  },
  {
    id: "other",
    method: "log",
    data: ["Unrelated output"],
    depth: 0,
    source: "client",
  },
];

export default function MessageTextProviderExample() {
  const addons = useMemo<ConsoleAddon[]>(() => {
    const textProvider: ConsoleAddon = {
      id: "example.message-text-provider",
      activate(host) {
        host.extensions.register(
          consoleExtensionPoints.messageTextProvider,
          {
            id: "release-search-text",
            provideText({ message }) {
              return message.id === "release" ? "deploy-target" : undefined;
            },
          },
          { id: "release-search-text" },
        );
      },
    };

    return [
      textProvider,
      createConsoleFilteringAddon({
        initialState: { text: "deploy-target" },
      }),
    ];
  }, []);

  return (
    <Console
      messages={messages}
      addons={addons}
      title="messageTextProvider"
      subtitle="Filtering can discover logical text that is not visibly rendered."
    />
  );
}
