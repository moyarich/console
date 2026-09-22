import { meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const EmptyTerminal: Story = {
  args: {
    title: "Waiting for a process",
    emptyMessage: "Run a command to see stdout and stderr here.",
    messages: [],
  },
};
