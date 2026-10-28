import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownStory, samples } from "./fixtures";

const meta = {
  title: "Addons/Markdown",
  component: MarkdownStory,
  args: { values: [samples.tables], narrow: true },
} satisfies Meta<typeof MarkdownStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TablesAndOverflow: Story = {};
