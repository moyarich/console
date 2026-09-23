import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";

const structuredMessages: ConsoleMessageData[] = [
  {
    id: "story-request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
    timestamp: Date.UTC(2026, 8, 23, 4, 0, 0),
    source: "preview:api-client",
  },
  {
    id: "story-warning",
    method: "warn",
    depth: 0,
    data: ["Cache nearing capacity", { usage: "86%" }],
    timestamp: Date.UTC(2026, 8, 23, 4, 0, 2),
    source: "preview:cache",
  },
];

const escape = String.fromCharCode(27);
const processMessages = [
  `${escape}[36mBuilding application...${escape}[0m\n`,
  "Progress 25%\r",
  "Progress 75%\r",
  `${escape}[32mProgress 100%${escape}[0m\n`,
];

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "storybook-build-status",
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
  title: "Console/Addons/Data export",
  component: Console,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function DataExportAddonStory() {
  const structuredAddons = useMemo(
    () => [createConsoleDataExportAddon({ fileName: "structured-console" })],
    [],
  );
  const ansiAddons = useMemo(
    () => [createConsoleDataExportAddon({ fileName: "process-output" })],
    [],
  );

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        width: 760,
        maxWidth: "90vw",
      }}
    >
      <Console
        messages={structuredMessages}
        addons={structuredAddons}
        title="Structured output export"
        subtitle="Use the action menu for JSON copy and text/JSON downloads."
        style={{ height: 240 }}
      />

      <Console
        mode="ansi"
        messages={processMessages}
        processors={processors}
        addons={ansiAddons}
        title="ANSI output export"
        subtitle="Exports the resolved process view rather than DOM text."
        style={{ height: 240 }}
      />
    </div>
  );
}

export const StructuredAndAnsi: Story = {
  render: () => <DataExportAddonStory />,
};
