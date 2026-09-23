import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageModeProps,
  type ConsoleValueRenderer,
} from "@moyarich/console";

const valueRenderers: ConsoleValueRenderer[] = [
  {
    type: "Object",
    match: (value) =>
      typeof value === "object" &&
      value !== null &&
      "kind" in value &&
      value.kind === "status",
    render: (value) => {
      const status = value as { kind: "status"; label: string; state: string };
      return (
        <span
          style={{
            display: "inline-flex",
            gap: 6,
            border: "1px solid currentColor",
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          <strong>{status.label}</strong>
          <span>{status.state}</span>
        </span>
      );
    },
  },
];

const meta = {
  title: "Console/Renderers/Value renderer",
  component: Console,
  args: {
    onClear: () => undefined,
  },
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatusValue: Story = {
  args: {
    valueRenderers,
    messages: [
      {
        method: "log",
        data: [
          "Deployment",
          { kind: "status", label: "API", state: "healthy" },
        ],
        depth: 0,
      },
      {
        method: "log",
        data: ["Default fallback", { untouched: true }],
        depth: 0,
      },
    ],
  },
};
