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

export const CommonMessages: Story = {
  args: {
    messages: [
      { method: "log", data: ["hello", 42, true], depth: 0 },
      { method: "info", data: ["Informational message"], depth: 0 },
      { method: "warn", data: ["Warning message"], depth: 0 },
      { method: "error", data: ["Error message"], depth: 0 },
      {
        method: "log",
        data: [{ package: "@moyarich/console", ready: true }],
        depth: 0,
      },
    ],
  },
};
