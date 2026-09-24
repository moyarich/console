import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  ConsoleFilteringControls,
  createConsoleFilteringAddon,
} from "@moyarich/console-addon-filtering";

const messages: ConsoleMessageData[] = [
  {
    id: "client-ready",
    method: "log",
    data: ["Application ready", { route: "/dashboard" }],
    depth: 0,
    source: "client",
  },
  {
    id: "api-request",
    method: "info",
    data: ["GET /api/projects", { status: 200, durationMs: 84 }],
    depth: 0,
    source: "api",
  },
  {
    id: "worker-cache",
    method: "warn",
    data: ["Cache nearing capacity", { usage: "86%" }],
    depth: 0,
    source: "worker",
  },
  {
    id: "api-error",
    method: "error",
    data: ["POST /api/projects failed", { status: 503 }],
    depth: 0,
    source: "api",
  },
  {
    id: "worker-debug",
    method: "debug",
    data: ["Retry scheduled", { attempt: 2 }],
    depth: 0,
    source: "worker",
  },
  {
    id: "host-hidden",
    method: "debug",
    data: ["Internal host diagnostic"],
    depth: 0,
    source: "client",
  },
];

const meta = {
  title: "Console/Addons/Filtering",
  component: Console,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

function FilteringAddonStory() {
  const filteringAddon = useMemo(() => createConsoleFilteringAddon(), []);
  const addons = useMemo(() => [filteringAddon], [filteringAddon]);

  return (
    <div style={{ display: "grid", gap: 12, width: 760, maxWidth: "90vw" }}>
      <ConsoleFilteringControls
        controller={filteringAddon.controller}
        messages={messages}
      />

      <Console
        messages={messages}
        addons={addons}
        filter={(message) => message.id !== "host-hidden"}
        title="Filtered console"
        subtitle="Method, text, and source filters compose with the host predicate."
        style={{
          width: "100%",
          height: 320,
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <FilteringAddonStory />,
};
