import { Console, type ConsoleMessageModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Console/Console",
  component: Console,
  args: {
    onClear: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RuntimeError: Story = {
  args: {
    title: "Failed script",
    messages: [{ method: "info", data: ["Starting import…"], depth: 0 }],
    error:
      "TypeError: Cannot read properties of undefined (reading 'name')\n    at loadProfile (profile.ts:18:12)",
  },
};
