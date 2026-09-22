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

export const Table: Story = {
  args: {
    messages: [
      {
        method: "table",
        data: [
          [
            { name: "margin", value: "10px" },
            { name: "padding", value: "8px" },
          ],
        ],
        depth: 0,
      },
    ],
  },
};
