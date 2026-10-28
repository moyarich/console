import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";
import "@moyarich/console/styles.css";

const addons = [createConsoleMarkdownAddon()];
const samples = {
  overview: [
    "# Markdown in the console",
    "",
    "## Release summary",
    "",
    "Rich **GFM**, *emphasis*, ~~strikethrough~~, and `inline code`.",
    "",
    "> Terminal-style Markdown presentation with readable hierarchy.",
    "",
    "- Lists and nested content",
    "- [x] Render task lists",
    "- [ ] Verify release",
    "",
    "1. Build",
    "2. Test",
    "3. Publish",
    "",
    "---",
    "",
    "[View repository](https://github.com/moyarich/console)",
  ].join("\n"),
};

function messages(...values: string[]): ConsoleMessageData[] {
  return values.map((value, index) => ({
    id: `markdown-story-${index}`,
    method: "log",
    data: [value],
    depth: 0,
  }));
}

function MarkdownStory({
  values,
  narrow = false,
}: {
  values: string[];
  narrow?: boolean;
}) {
  return (
    <div style={{ width: "100%", maxWidth: narrow ? 400 : 900 }}>
      <Console
        title="Markdown addon"
        subtitle="GFM inside structured console messages"
        messages={messages(...values)}
        addons={addons}
        style={{ height: 540, width: "100%", minWidth: 0 }}
      />
    </div>
  );
}

const meta = {
  title: "Addons/Markdown",
  component: MarkdownStory,
  args: { values: [samples.overview] },
} satisfies Meta<typeof MarkdownStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
