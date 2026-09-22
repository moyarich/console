import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const Table: Story = {
  args: {
    messages: [
      {
        method: "table",
        data: [
          [
            { name: "margin", value: "10px" },
            { name: "padding", value: "8px" },
          ],
        ],
        depth: 0,
      },
    ],
  },
};
