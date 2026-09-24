import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleProcessOutputProcessor } from "@moyarich/console";
import { createConsoleDiagnosticsAddon } from "@moyarich/console-addon-diagnostics";

const messages = ["Progress 10%\r", "Progress 60%\r", "Progress 100%\n"];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "storybook-diagnostics-transform",
    process(output) {
      if (!output.data.includes("Progress 100%")) return;
      return {
        data: output.data.replace("Progress 100%", "Build complete"),
        metadata: { phase: "build", complete: true },
      };
    },
  },
];

const meta = {
  title: "Console/Addons/Diagnostics/ANSI",
  component: Console,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function AnsiDiagnosticsStory() {
  const addons = useMemo(() => [createConsoleDiagnosticsAddon()], []);

  return (
    <Console
      mode="ansi"
      messages={messages}
      processors={processors}
      addons={addons}
      title="ANSI diagnostics"
      subtitle="Inspect raw, normalized, and processor-resolved output separately."
      style={{ width: 760, maxWidth: "90vw", height: 280 }}
    />
  );
}

export const Default: Story = {
  render: () => <AnsiDiagnosticsStory />,
};
