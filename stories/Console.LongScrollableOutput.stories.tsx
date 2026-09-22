import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const LongScrollableOutput: Story = {
  args: {
    title: "Batch processing",
    autoScroll: false,
    resizable: "vertical",
    style: { height: 260, minHeight: 160, maxHeight: 600 },
    messages: Array.from({ length: 100 }, (_, index) => ({
      id: `batch-${index}`,
      method: index % 10 === 0 ? "warn" : "log",
      depth: 0,
      data: [
        `Record ${index + 1}`,
        { status: index % 10 === 0 ? "retry" : "complete" },
      ],
    })),
  },
};
