import { Console, type ConsoleAnsiModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

function ClearableOutputStory(args: ConsoleAnsiModeProps) {
  const [messages, setMessages] = useState(args.messages ?? []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={() => setMessages(args.messages ?? [])}>
        Restore output
      </button>
      <Console {...args} messages={messages} onClear={() => setMessages([])} />
    </div>
  );
}

const meta = {
  title: "Console/ANSI Process Output",
  component: Console,
  args: {
    mode: "ansi",
    onClear: () => undefined,
    resizable: "vertical",
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

export const ClearAndRestore: Story = {
  render: (args) => <ClearableOutputStory {...args} />,
  args: {
    title: "Clear and restore",
    subtitle: "Use the header actions menu to clear the output",
    emptyMessage: "Output cleared. Restore it with the button above.",
    messages: [
      "First line\n",
      "Second line\n",
      "\u001b[32mTask complete\u001b[0m\n",
    ],
  },
};
