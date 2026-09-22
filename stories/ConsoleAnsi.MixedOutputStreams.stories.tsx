import { meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const MixedOutputStreams: Story = {
  args: {
    title: "Build output",
    messages: [
      { id: "start", stream: "stdout", data: "Starting production build…\n" },
      {
        id: "warning",
        stream: "stderr",
        data: "\u001b[33mWarning: bundle exceeds 500 kB\u001b[0m\n",
      },
      {
        id: "done",
        stream: "stdout",
        data: "\u001b[32mBuild completed\u001b[0m\n",
      },
      {
        id: "error",
        stream: "stderr",
        data: "\u001b[31mUpload failed: connection timed out\u001b[0m\n",
      },
    ],
  },
};
