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

export const SelectedTableColumns: Story = {
  args: {
    messages: [
      {
        method: "table",
        depth: 0,
        columns: ["name", "status"],
        data: [
          [
            { name: "API", status: "healthy", region: "us-east" },
            { name: "Worker", status: "restarting", region: "eu-west" },
            { name: "Cache", status: "healthy", region: "us-west" },
          ],
        ],
      },
    ],
  },
};
