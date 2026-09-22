import { jsonLines, meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const RawJsonOutput: Story = {
  args: {
    title: "Raw JSON text",
    parseStructuredOutput: false,
    messages: jsonLines,
  },
};
