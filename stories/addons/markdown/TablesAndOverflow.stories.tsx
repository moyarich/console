import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";
import "@moyarich/console/styles.css";

const addons = [createConsoleMarkdownAddon()];
const samples = {
  tables: [
    "## GitHub Actions summary",
    "",
    "| Package | Current | Next | Status |",
    "| :--- | ---: | ---: | :---: |",
    "| console | 0.1.0 | 0.1.1 | ✅ |",
    "| markdown | 0.1.0 | 0.1.1 | ✅ |",
    "| very-long-package-name-for-overflow-testing | 0.1.0 | 0.1.1 | ⏳ |",
    "",
    "> Tables scroll horizontally in narrow containers.",
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
  args: { values: [samples.tables], narrow: true },
} satisfies Meta<typeof MarkdownStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TablesAndOverflow: Story = {};
