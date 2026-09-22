import { Console, type ConsoleAnsiModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Console/ANSI Process Output",
  component: Console,
  args: {
    mode: "ansi",
    onClear: () => undefined,
    resizable: "vertical",
    style: { height: 360, minHeight: 240, maxHeight: 640 },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleAnsiModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyTerminal: Story = {
  args: {
    title: "Waiting for a process",
    emptyMessage: "Run a command to see stdout and stderr here.",
    messages: [],
  },
};
