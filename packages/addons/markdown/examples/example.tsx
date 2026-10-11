import { useMemo } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";
import "@moyarich/console/styles.css";

const GITHUB_STEP_SUMMARY = [
  "## Release dry run",
  "",
  "| Field | Value |",
  "| --- | --- |",
  "| Package | `@moyarich/console` |",
  "| Mode | patch |",
  "| Current | `0.1.0` |",
  "| Next | `0.1.1` |",
  "",
  "### Changes",
  "",
  "- Added reusable Pages workflow",
  "- Added workflow summary output",
].join("\n");

const messages: ConsoleMessageData[] = [
  {
    id: "summary",
    method: "log",
    data: [GITHUB_STEP_SUMMARY],
    depth: 0,
  },
  {
    id: "plain",
    method: "log",
    data: ["Build complete\nhttps://github.com/moyarich/console"],
    depth: 0,
  },
];

export default function MarkdownAddonExample() {
  const markdownAddon = useMemo(() => createConsoleMarkdownAddon(), []);
  const addons = useMemo(() => [markdownAddon], [markdownAddon]);

  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <Console
        messages={messages}
        addons={addons}
        title="Automatic Markdown"
        subtitle="Markdown strings render richly while ordinary logs stay plain."
        style={{ height: 420 }}
      />
    </div>
  );
}
