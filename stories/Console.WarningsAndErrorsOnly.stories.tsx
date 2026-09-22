import { CommonMessages } from "./Console.CommonMessages.stories";
import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const WarningsAndErrorsOnly: Story = {
  args: {
    ...CommonMessages.args,
    title: "Warnings and errors",
    filter: (message) =>
      message.method === "warn" || message.method === "error",
  },
};
