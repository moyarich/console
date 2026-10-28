import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownStory, samples } from "./fixtures";

const meta = {
  title: "Addons/Markdown",
  component: MarkdownStory,
  args: { values: [samples.code] },
} satisfies Meta<typeof MarkdownStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CodeFences: Story = {};
