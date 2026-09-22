import { useState } from "react";
import {
  Console,
  type ConsoleLinkProvider,
  type ConsoleMessageData,
  type ConsoleStdoutEntry,
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

const ansiMessages: ConsoleStdoutEntry[] = [
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

export default function LinkProvidersExample() {
  const [lastOpened, setLastOpened] = useState({
    console: "",
    ansi: "",
  });

  const sourceProvider: ConsoleLinkProvider = {
    id: "source-location",
    provideLinks(text) {
      const matches = text.matchAll(
        /\b[\w./-]+\.(?:ts|tsx|js|jsx):\d+(?::\d+)?\b/g,
      );

      return Array.from(matches, (match) => ({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        title: "Run host source-location action",
        action: ({ link, mode }) =>
          setLastOpened((current) => ({
            ...current,
            [mode]: link.text,
          })),
      }));
    },
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <Console
          messages={messages}
          linkProviders={[sourceProvider]}
          subtitle="Automatic web links plus a custom source-location action"
        />

        <div data-console-link-provider-result>
          Structured provider action:
          <strong>
            {lastOpened.console
              ? ` ${lastOpened.console}`
              : " click a source location above"}
          </strong>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <Console
          mode="ansi"
          messages={ansiMessages}
          linkProviders={[sourceProvider]}
          subtitle="ANSI output uses the same web-link detection and provider"
        />

        <div data-ansi-link-provider-result>
          ANSI provider action:
          <strong>
            {lastOpened.ansi
              ? ` ${lastOpened.ansi}`
              : " click the source location above"}
          </strong>
        </div>
      </div>
    </div>
  );
}
