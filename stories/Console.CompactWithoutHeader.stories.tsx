import { CommonMessages } from "./Console.CommonMessages.stories";
import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const CompactWithoutHeader: Story = {
  args: {
    ...CommonMessages.args,
    showHeader: false,
    style: { height: 180 },
  },
};
