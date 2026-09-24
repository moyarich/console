import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleProcessOutputProcessor } from "@moyarich/console";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";

const escape = String.fromCharCode(27);
const messages = [
  `${escape}[36mBuilding application...${escape}[0m\n`,
  "Progress 25%\r",
  "Progress 75%\r",
  `${escape}[32mProgress 100%${escape}[0m\n`,
];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "storybook-build-status",
    process({ output }) {
      if (!output.data.includes("Progress 100%")) return;
      return {
        data: output.data.replace("Progress 100%", "Build complete"),
        metadata: { phase: "build", complete: true },
      };
    },
  },
];

const meta = {
  title: "Console/Addons/Data export/ANSI",
  component: Console,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function AnsiDataExportStory() {
  const addons = useMemo(
    () => [createConsoleDataExportAddon({ fileName: "process-output" })],
    [],
  );

  return (
    <Console
      mode="ansi"
      messages={messages}
      processors={processors}
      addons={addons}
      title="ANSI output export"
      subtitle="Export the resolved logical process view."
      style={{ width: 760, maxWidth: "90vw", height: 280 }}
    />
  );
}

export const Default: Story = {
  render: () => <AnsiDataExportStory />,
};
