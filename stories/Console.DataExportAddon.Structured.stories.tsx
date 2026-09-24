import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";

const messages: ConsoleMessageData[] = [
  {
    id: "request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
    source: "preview:api-client",
  },
  {
    id: "warning",
    method: "warn",
    depth: 0,
    data: ["Cache nearing capacity", { usage: "86%" }],
    source: "preview:cache",
  },
];

const meta = {
  title: "Console/Addons/Data export/Structured",
  component: Console,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function StructuredDataExportStory() {
  const addons = useMemo(
    () => [createConsoleDataExportAddon({ fileName: "structured-console" })],
    [],
  );

  return (
    <Console
      messages={messages}
      addons={addons}
      title="Structured output export"
      subtitle="Export underlying ConsoleMessageData."
      style={{ width: 760, maxWidth: "90vw", height: 280 }}
    />
  );
}

export const Default: Story = {
  render: () => <StructuredDataExportStory />,
};
