import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";

const GITHUB_STEP_SUMMARY = [
  "## GitHub Actions summary",
  "",
  "| Check | Result |",
  "| --- | --- |",
  "| Typecheck | ✅ |",
  "| Tests | ✅ |",
  "| Build | ✅ |",
  "",
  "### Notes",
  "",
  "- Package: `@moyarich/console`",
  "- Release mode: **patch**",
].join("\n");

const messages: ConsoleMessageData[] = [
  {
    id: "markdown-summary",
    method: "log",
    data: [GITHUB_STEP_SUMMARY],
    depth: 0,
  },
  {
    id: "plain-output",
    method: "log",
    data: ["Plain process note\nhttps://github.com/moyarich/console"],
    depth: 0,
  },
];

const meta = {
  title: "Console/Addons/Markdown",
  component: Console,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function MarkdownAddonStory() {
  const markdownAddon = useMemo(() => createConsoleMarkdownAddon(), []);
  const addons = useMemo(() => [markdownAddon], [markdownAddon]);

  return (
    <div style={{ width: 760, maxWidth: "90vw" }}>
      <Console
        messages={messages}
        addons={addons}
        title="Automatic Markdown"
        subtitle="A GitHub-style summary renders as Markdown; the following URL stays plain."
        style={{
          width: "100%",
          height: 420,
        }}
      />
    </div>
  );
}

export const GitHubStepSummary: Story = {
  render: () => <MarkdownAddonStory />,
};
