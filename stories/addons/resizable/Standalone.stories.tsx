import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageModeProps } from "@moyarich/console";
import { ResizableConsoleExample } from "./fixtures";

const meta = {
  title: "Addons/Resizable Console",
  component: Console,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standalone: Story = {
  render: () => (
    <div style={{ padding: 24 }}>
      <ResizableConsoleExample />
    </div>
  ),
  args: {
    messages: [],
  },
};

