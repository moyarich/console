import { meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const SplitChunksAndLineEndings: Story = {
  args: {
    title: "Chunk boundaries",
    subtitle: "CRLF can span entries; carriage returns replace progress",
    messages: [
      { id: "part-2", stream: "stdout", data: "Downloading dependency\r" },
      { id: "part-3", stream: "stdout", data: "\n" },
      { id: "progress-1", stream: "stdout", data: "Processing: 10%" },
      { id: "progress-2", stream: "stdout", data: "\rProcessing: 100%\n" },
      { id: "complete", stream: "stdout", data: "Complete\n" },
    ],
  },
};
