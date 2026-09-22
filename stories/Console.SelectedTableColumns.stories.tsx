import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const SelectedTableColumns: Story = {
  args: {
    messages: [
      {
        method: "table",
        depth: 0,
        columns: ["name", "status"],
        data: [
          [
            { name: "API", status: "healthy", region: "us-east" },
            { name: "Worker", status: "restarting", region: "eu-west" },
            { name: "Cache", status: "healthy", region: "us-west" },
          ],
        ],
      },
    ],
  },
};
