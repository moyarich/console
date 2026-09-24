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

const jsonLines = [
  "Receiving structured output…\n",
  '{"event":"build","success":true,"assets":["app.js","app.css"]}\n',
  '[{"name":"API","healthy":true},{"name":"Worker","healthy":false}]\n',
  "{this is not valid JSON}\n",
];

export const StructuredJsonOutput: Story = {
  args: {
    title: "JSON inspection",
    parseStructuredOutput: true,
    messages: jsonLines,
  },
};
