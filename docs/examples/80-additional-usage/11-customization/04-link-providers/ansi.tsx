import { useState } from "react";
import {
  Console,
  type ConsoleLinkProvider,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleStdoutEntry[] = [
  {
    id: "docs",
    stream: "stdout",
    data: "Repository: https://github.com/moyarich/console\n",
  },
  {
    id: "source-error",
    stream: "stderr",
    data: "Error: packages/console/src/components/ConsoleStdout.tsx:1\n",
  },
];

export default function AnsiLinkProviderExample() {
  const [lastOpened, setLastOpened] = useState("");

  const sourceProvider: ConsoleLinkProvider = {
    id: "source-location",
    provideLinks({ text }) {
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
        mode="ansi"
        messages={messages}
        linkProviders={[sourceProvider]}
        title="ANSI link provider"
        subtitle="The same provider API works against terminal output"
      />
      <div data-ansi-link-provider-result>
        Last source action:{" "}
        <strong>{lastOpened || "click a source link"}</strong>
      </div>
    </div>
  );
}
