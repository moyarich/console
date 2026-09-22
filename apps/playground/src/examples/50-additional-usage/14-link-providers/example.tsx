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
      "Documentation: https://example.com/docs",
      { source: "src/runtime/worker.ts:42:8" },
    ],
    depth: 0,
  },
  {
    method: "error",
    data: ["Build failed at src/app.tsx:18:5"],
    depth: 0,
  },
];

export default function LinkProvidersExample() {
  const [lastOpened, setLastOpened] = useState("");

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
        title: "Open source location",
        action: ({ link }) => setLastOpened(link.text),
      }));
    },
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Console
        messages={messages}
        linkProviders={[sourceProvider]}
        subtitle="HTTP/HTTPS links plus a custom source-location provider"
      />

      <Console
        mode="ansi"
        messages={[
          "Docs: https://example.com/cli",
          "Error: src/cli/run.ts:91:12",
        ]}
        linkProviders={[sourceProvider]}
        subtitle="The same providers also work in ANSI output"
      />

      <div>
        Custom provider action:
        <strong>{lastOpened ? ` ${lastOpened}` : " click a source location"}</strong>
      </div>
    </div>
  );
}
