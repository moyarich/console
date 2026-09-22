import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageModeProps,
} from "@moyarich/console";

const messages = Array.from({ length: 40 }, (_, index) => ({
  id: `resize-story-${index}`,
  method: index % 10 === 0 ? ("warn" as const) : ("log" as const),
  depth: 0,
  data: [
    `Message ${index + 1}`,
    {
      status: index % 10 === 0 ? "warning" : "ready",
      resizeSafe: true,
    },
  ],
}));

const meta = {
  title: "Console/Resizable",
  component: Console,
  args: {
    messages,
    resizable: "both",
    autoScroll: false,
    title: "Resizable console",
    subtitle:
      "Drag the native resize handle; the output viewport remains scrollable.",
    style: {
      width: 720,
      height: 300,
      minWidth: 320,
      minHeight: 180,
      maxWidth: "100%",
      maxHeight: 600,
    },
  },
  argTypes: {
    resizable: {
      control: "select",
      options: ["vertical", "horizontal", "both", "block", "inline"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BothDirections: Story = {};

export const VerticalOnly: Story = {
  args: {
    resizable: "vertical",
  },
};

export const HorizontalOnly: Story = {
  args: {
    resizable: "horizontal",
  },
};
