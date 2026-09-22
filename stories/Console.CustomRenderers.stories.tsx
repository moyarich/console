import {
  Console,
  type ConsoleMessageModeProps,
  type ConsoleMessageRenderer,
  type ConsoleValueRenderer,
} from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

const customValueRenderers: ConsoleValueRenderer[] = [
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

const customMessageRenderers: ConsoleMessageRenderer[] = [
  {
    method: "info",
    render: (_message, { renderDefault }) => (
      <div style={{ borderLeft: "3px solid currentColor", paddingLeft: 4 }}>
        {renderDefault()}
      </div>
    ),
  },
];

const meta = {
  title: "Console/Console",
  component: Console,
  args: {
    onClear: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleMessageModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomRenderers: Story = {
  args: {
    messageRenderers: customMessageRenderers,
    valueRenderers: customValueRenderers,
    messages: [
      {
        method: "info",
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
