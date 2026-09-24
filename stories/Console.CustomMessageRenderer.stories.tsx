import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageModeProps,
  type ConsoleMessageRenderer,
} from "@moyarich/console";

const messageRenderers: ConsoleMessageRenderer[] = [
  {
    method: "info",
    match: ({ message }) => message.source === "build",
    render: ({ renderDefault }) => (
      <div style={{ borderLeft: "3px solid currentColor", paddingLeft: 6 }}>
        {renderDefault()}
      </div>
    ),
  },
];

const meta = {
  title: "Console/Renderers/Message renderer",
  component: Console,
  args: {
    onClear: () => undefined,
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BuildMessage: Story = {
  args: {
    messageRenderers,
    messages: [
      {
        method: "info",
        source: "build",
        data: ["Build completed", { durationMs: 842 }],
        depth: 0,
      },
      {
        method: "info",
        source: "network",
        data: ["Request completed", { status: 200 }],
        depth: 0,
      },
    ],
  },
};
