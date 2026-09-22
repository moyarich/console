import { jsonLines, meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const StructuredJsonOutput: Story = {
  args: {
    title: "JSON inspection",
    parseStructuredOutput: true,
    messages: jsonLines,
  },
};
