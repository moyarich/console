import { Console, type ConsoleTerminalModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import PyodideTqdmProgressExample from "../packages/console/docs/examples/10-ansi/04-progress/02-pyodide-tqdm-progress/example";

const meta = {
  title: "Console/ANSI Process Output",
  component: Console,
  args: {
    mode: "terminal",
    onClear: () => undefined,
    style: { height: 360, minHeight: 240, maxHeight: 640 },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleTerminalModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PyodideTqdmBrowserRuntime: Story = {
  render: () => <PyodideTqdmProgressExample />,
  args: {
    messages: [],
  },
};
