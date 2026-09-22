import { nestedEnterprise, meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const NestedObject: Story = {
  args: {
    messages: [{ method: "log", data: [nestedEnterprise], depth: 0 }],
  },
};
