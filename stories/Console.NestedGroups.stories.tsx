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

export const NestedGroups: Story = {
  args: {
    messages: [
      { method: "group", data: ["Deployment"], depth: 0 },
      { method: "log", data: ["Validating configuration"], depth: 1 },
      { method: "groupCollapsed", data: ["Build details"], depth: 1 },
      { method: "log", data: ["Compiled 24 modules"], depth: 2 },
      { method: "warn", data: ["Source maps disabled"], depth: 2 },
      { method: "info", data: ["Deployment ready"], depth: 1 },
    ],
  },
};
