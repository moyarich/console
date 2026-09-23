import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleDiagnosticsAddon } from "@moyarich/console-addon-diagnostics";

const messages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
    source: "preview:api-client",
  },
];

const meta = {
  title: "Console/Addons/Diagnostics/Structured",
  component: Console,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function StructuredDiagnosticsStory() {
  const addons = useMemo(() => [createConsoleDiagnosticsAddon()], []);

  return (
    <Console
      messages={messages}
      addons={addons}
      title="Structured diagnostics"
      subtitle="Inspect retained and visible logical message data."
      style={{ width: 760, maxWidth: "90vw", height: 280 }}
    />
  );
}

export const Default: Story = {
  render: () => <StructuredDiagnosticsStory />,
};
