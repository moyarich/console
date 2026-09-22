import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageModeProps,
  type ConsoleMessageRenderer,
  type ConsoleValueRenderer,
} from "@moyarich/console";

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

export const RuntimeError: Story = {
  args: {
    title: "Failed script",
    messages: [{ method: "info", data: ["Starting import…"], depth: 0 }],
    error:
      "TypeError: Cannot read properties of undefined (reading 'name')\n    at loadProfile (profile.ts:18:12)",
  },
};

export const NestedGroups: Story = {
  args: {
    messages: [
      { method: "group", data: ["Deployment"], depth: 0 },
      { method: "log", data: ["Validating configuration"], depth: 1 },
      { method: "groupCollapsed", data: ["Build details"], depth: 1 },
      { method: "log", data: ["Compiled 24 modules"], depth: 2 },
      { method: "warn", data: ["Source maps disabled"], depth: 2 },
      { method: "info", data: ["Deployment ready"], depth: 1 },
    ],
  },
};

export const WarningsAndErrorsOnly: Story = {
  args: {
    ...CommonMessages.args,
    title: "Warnings and errors",
    filter: (message) =>
      message.method === "warn" || message.method === "error",
  },
};

export const SelectedTableColumns: Story = {
  args: {
    messages: [
      {
        method: "table",
        depth: 0,
        columns: ["name", "status"],
        data: [
          [
            { name: "API", status: "healthy", region: "us-east" },
            { name: "Worker", status: "restarting", region: "eu-west" },
            { name: "Cache", status: "healthy", region: "us-west" },
          ],
        ],
      },
    ],
  },
};

export const CompactWithoutHeader: Story = {
  args: {
    ...CommonMessages.args,
    showHeader: false,
    style: { height: 180 },
  },
};

export const LongScrollableOutput: Story = {
  args: {
    title: "Batch processing",
    autoScroll: false,
    resizable: "vertical",
    style: { height: 260, minHeight: 160, maxHeight: 600 },
    messages: Array.from({ length: 100 }, (_, index) => ({
      id: `batch-${index}`,
      method: index % 10 === 0 ? "warn" : "log",
      depth: 0,
      data: [
        `Record ${index + 1}`,
        { status: index % 10 === 0 ? "retry" : "complete" },
      ],
    })),
  },
};
