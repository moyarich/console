import { Console, type ConsoleAnsiModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Console/ANSI Process Output",
  component: Console,
  args: {
    mode: "ansi",
    onClear: () => undefined,
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

export const SplitChunksAndLineEndings: Story = {
  args: {
    title: "Chunk boundaries",
    subtitle: "CRLF can span entries; carriage returns replace progress",
    messages: [
      { id: "part-2", stream: "stdout", data: "Downloading dependency\r" },
      { id: "part-3", stream: "stdout", data: "\n" },
      { id: "progress-1", stream: "stdout", data: "Processing: 10%" },
      { id: "progress-2", stream: "stdout", data: "\rProcessing: 100%\n" },
      { id: "complete", stream: "stdout", data: "Complete\n" },
    ],
  },
};
