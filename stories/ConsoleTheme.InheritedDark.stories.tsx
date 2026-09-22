import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
const meta = { title: "Console/Theming", component: Console } satisfies Meta<
  typeof Console
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InheritedDark: Story = {
  args: {
    title: "Dark theme header",
    subtitle: "Inherits the host color scheme",
    messages: [{ method: "log", data: ["Dark header and output"], depth: 0 }],
  },
  decorators: [
    (Story) => (
      <div style={{ colorScheme: "dark", background: "#0d1117", padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector(".console-panel-header");
    if (
      !header ||
      getComputedStyle(header).backgroundColor !== "rgb(22, 27, 34)"
    )
      throw new Error("Header must inherit the host dark color scheme");
  },
};
