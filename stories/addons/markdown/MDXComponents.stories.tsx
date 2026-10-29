import type { Meta, StoryObj } from "@storybook/react-vite";
import { MDXProvider } from "@mdx-js/react";
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

function WithMDXComponents() {
  return (
    <MDXProvider
      components={{
        h2: (props) => <h2 {...props} style={{ color: "#58a6ff" }} />,
        blockquote: (props) => (
          <blockquote {...props} style={{ borderLeftColor: "#58a6ff" }} />
        ),
      }}
    >
      <MarkdownStory values={[samples.overview, samples.code]} />
    </MDXProvider>
  );
}

const meta = {
  title: "Addons/Markdown",
  component: WithMDXComponents,
} satisfies Meta<typeof WithMDXComponents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MDXComponents: Story = {};
