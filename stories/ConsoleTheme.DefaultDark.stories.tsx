import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
const meta = { title: "Console/Theming", component: Console } satisfies Meta<
  typeof Console
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DefaultDark: Story = {
  args: {
    title: "Console",
    subtitle: "Dark header by default",
    messages: [
      { method: "log", data: ["No theme overrides required"], depth: 0 },
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          colorScheme: "light",
          fontFamily: "system-ui, sans-serif",
          maxWidth: 880,
          margin: "24px auto",
        }}
      >
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
      throw new Error("The default header must be dark even in a light host");
  },
};
