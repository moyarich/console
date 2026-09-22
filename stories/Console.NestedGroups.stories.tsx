import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const NestedGroups: Story = {
  args: {
    messages: [
      { method: "group", data: ["Deployment"], depth: 0 },
      { method: "log", data: ["Validating configuration"], depth: 1 },
      { method: "groupCollapsed", data: ["Build details"], depth: 1 },
      { method: "log", data: ["Compiled 24 modules"], depth: 2 },
      { method: "warn", data: ["Source maps disabled"], depth: 2 },
      { method: "info", data: ["Deployment ready"], depth: 1 },
    ],
  },
};
