import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageModeProps } from "@moyarich/console";
import { EditorShell } from "./fixtures";

const meta = {
  title: "Addons/Resizable Console",
  component: Console,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DockableEditorShell: Story = {
  render: () => (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        padding: 24,
        overflow: "hidden",
      }}
    >
      <EditorShell />
    </div>
  ),
  args: {
    messages: [],
  },
};
