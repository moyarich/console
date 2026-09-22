import { meta as sharedMeta, Story } from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const RuntimeError: Story = {
  args: {
    title: "Failed script",
    messages: [{ method: "info", data: ["Starting import…"], depth: 0 }],
    error:
      "TypeError: Cannot read properties of undefined (reading 'name')\n    at loadProfile (profile.ts:18:12)",
  },
};
