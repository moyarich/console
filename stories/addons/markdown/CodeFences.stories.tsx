import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";
import "@moyarich/console/styles.css";

const addons = [createConsoleMarkdownAddon()];
const samples = {
  code: [
    "## Code fences",
    "",
    "```tsx",
    "export function Greeting({ name }: { name: string }) {",
    "  return <strong>Hello, {name}!</strong>;",
    "}",
    "```",
    "",
    "```bash",
    "npm run typecheck && npm test",
    "```",
    "",
    "A very long line stays scrollable:",
    "",
    "```text",
    "0123456789".repeat(18),
    "```",
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
  args: { values: [samples.code] },
} satisfies Meta<typeof MarkdownStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CodeFences: Story = {};
