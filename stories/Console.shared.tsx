import {
  Console,
  type ConsoleMessageModeProps,
  type ConsoleMessageRenderer,
  type ConsoleValueRenderer,
} from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
export const nestedEnterprise = {
  enterpriseName: "TechNova Global",
  hqLocation: "San Francisco",
  divisions: [
    {
      divisionId: "DIV-01",
      departments: {
        engineering: {
          teams: [
            {
              teamName: "Core Platform",
              projects: {
                quantumCloud: {
                  status: "Active",
                  budget: 1_250_000,
                },
              },
            },
          ],
        },
      },
    },
  ],
};
export const customValueRenderers: ConsoleValueRenderer[] = [
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
export const customMessageRenderers: ConsoleMessageRenderer[] = [
  {
    method: "info",
    render: (_message, { renderDefault }) => (
      <div style={{ borderLeft: "3px solid currentColor", paddingLeft: 4 }}>
        {renderDefault()}
      </div>
    ),
  },
];
export const meta = {
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
export type Story = StoryObj<typeof meta>;
