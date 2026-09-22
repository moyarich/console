import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const CommonMessages: Story = {
  args: {
    messages: [
      { method: "log", data: ["hello", 42, true], depth: 0 },
      { method: "info", data: ["Informational message"], depth: 0 },
      { method: "warn", data: ["Warning message"], depth: 0 },
      { method: "error", data: ["Error message"], depth: 0 },
      {
        method: "log",
        data: [{ package: "@moyarich/console", ready: true }],
        depth: 0,
      },
    ],
  },
};
