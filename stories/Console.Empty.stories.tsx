import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const Empty: Story = {
  args: { messages: [] },
};
