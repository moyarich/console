import {
  ClearableOutputStory,
  meta as sharedMeta,
  Story,
} from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
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
