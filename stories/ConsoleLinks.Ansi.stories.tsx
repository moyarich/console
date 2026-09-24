import type { Meta, StoryObj } from "@storybook/react-vite";
import AnsiLinkProviderExample from "../apps/playground/src/examples/80-additional-usage/14-link-providers/ansi";

const meta = {
  title: "Console/Link Providers/ANSI",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SourceLocation: Story = {
  render: () => <AnsiLinkProviderExample />,
  play: async ({ canvasElement }) => {
    const ansiConsole = canvasElement.querySelector(
      '[data-console-mode="ansi"]',
    );

    if (!ansiConsole) {
      throw new Error("Expected the ANSI link-provider console.");
    }

    const sourceLink = ansiConsole.querySelector<HTMLButtonElement>(
      "button.console-link-button",
    );

    if (!sourceLink) {
      throw new Error("Expected an ANSI source-location provider link.");
    }

    sourceLink.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const result = canvasElement.querySelector(
      "[data-ansi-link-provider-result] strong",
    );

    if (!result?.textContent?.includes(".tsx:")) {
      throw new Error("Expected the ANSI provider action to run.");
    }
  },
};
