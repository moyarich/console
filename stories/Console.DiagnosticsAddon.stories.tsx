import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import {
  createConsoleDiagnosticsAddon,
} from "@moyarich/console-addon-diagnostics";

const structuredMessages: ConsoleMessageData[] = [
  {
    id: "story-request",
    method: "log",
    depth: 0,
    data: ["Request complete", { status: 200, durationMs: 84 }],
    source: "preview:api-client",
  },
];

const processMessages = [
  "Progress 10%\r",
  "Progress 60%\r",
  "Progress 100%\n",
];

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
  title: "Console/Addons/Diagnostics",
  component: Console,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function DiagnosticsAddonStory() {
  const addons = useMemo(() => [createConsoleDiagnosticsAddon()], []);

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
        addons={addons}
        title="Structured diagnostics"
        subtitle="Copy/download retained and visible logical message diagnostics."
        style={{ height: 240 }}
      />

      <Console
        mode="ansi"
        messages={processMessages}
        processors={processors}
        addons={addons}
        title="ANSI diagnostics"
        subtitle="Diagnostic JSON preserves raw chunks and resolved output separately."
        style={{ height: 240 }}
      />
    </div>
  );
}

export const StructuredAndAnsi: Story = {
  render: () => <DiagnosticsAddonStory />,
};
