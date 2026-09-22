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

export const MixedOutputStreams: Story = {
  args: {
    title: "Build output",
    messages: [
      { id: "start", stream: "stdout", data: "Starting production build…\n" },
      {
        id: "warning",
        stream: "stderr",
        data: "\u001b[33mWarning: bundle exceeds 500 kB\u001b[0m\n",
      },
      {
        id: "done",
        stream: "stdout",
        data: "\u001b[32mBuild completed\u001b[0m\n",
      },
      {
        id: "error",
        stream: "stderr",
        data: "\u001b[31mUpload failed: connection timed out\u001b[0m\n",
      },
    ],
  },
};
