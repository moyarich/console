import { Console, type ConsoleMessageModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Console/Console",
  component: Console,
  args: {
    onClear: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LongScrollableOutput: Story = {
  args: {
    title: "Batch processing",
    autoScroll: false,
    resizable: "vertical",
    style: { height: 260, minHeight: 160, maxHeight: 600 },
    messages: Array.from({ length: 100 }, (_, index) => ({
      id: `batch-${index}`,
      method: index % 10 === 0 ? "warn" : "log",
      depth: 0,
      data: [
        `Record ${index + 1}`,
        { status: index % 10 === 0 ? "retry" : "complete" },
      ],
    })),
  },
};
