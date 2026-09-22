import { Console, type ConsoleMessageModeProps } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const NestedObject: Story = {
  args: {
    messages: [{ method: "log", data: [nestedEnterprise], depth: 0 }],
  },
};
