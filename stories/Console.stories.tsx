import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageModeProps } from "@moyarich/console";

const nestedEnterprise = {
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

export const Empty: Story = {
  args: { messages: [] },
};

export const CommonMessages: Story = {
  args: {
    messages: [
      { method: "log", data: ["hello", 42, true], depth: 0 },
      { method: "info", data: ["Informational message"], depth: 0 },
      { method: "warn", data: ["Warning message"], depth: 0 },
      { method: "error", data: ["Error message"], depth: 0 },
      {
        method: "log",
        data: [{ package: "@moyarich/console", ready: true }],
        depth: 0,
      },
    ],
  },
};

export const NestedObject: Story = {
  args: {
    messages: [{ method: "log", data: [nestedEnterprise], depth: 0 }],
  },
};

export const Table: Story = {
  args: {
    messages: [
      {
        method: "table",
        data: [
          [
            { name: "margin", value: "10px" },
            { name: "padding", value: "8px" },
          ],
        ],
        depth: 0,
      },
    ],
  },
};
