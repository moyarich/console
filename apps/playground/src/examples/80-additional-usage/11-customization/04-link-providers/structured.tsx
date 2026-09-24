import { useState } from "react";
import {
  Console,
  type ConsoleLinkProvider,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    method: "info",
    data: [
      "Repository: https://github.com/moyarich/console",
      { source: "packages/console/src/components/Console.tsx:1" },
    ],
    depth: 0,
  },
  {
    method: "error",
    data: ["Build failed at packages/console/src/links.tsx:1"],
    depth: 0,
  },
];

export default function StructuredLinkProviderExample() {
  const [lastOpened, setLastOpened] = useState("");

  const sourceProvider: ConsoleLinkProvider = {
    id: "source-location",
    provideLinks(text) {
      return Array.from(
        text.matchAll(/\b[\w./-]+\.(?:ts|tsx|js|jsx):\d+(?::\d+)?\b/g),
        (match) => ({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          title: "Open source location",
          action: ({ link }) => setLastOpened(link.text),
        }),
      );
    },
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Console
        messages={messages}
        linkProviders={[sourceProvider]}
        title="Structured link provider"
        subtitle="Automatic web links plus an application-specific source action"
      />
      <div data-console-link-provider-result>
        Last source action:{" "}
        <strong>{lastOpened || "click a source link"}</strong>
      </div>
    </div>
  );
}
