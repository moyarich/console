import type { Meta, StoryObj } from "@storybook/react-vite";
import StructuredLinkProviderExample from "../docs/examples/80-additional-usage/11-customization/04-link-providers/structured";

const meta = {
  title: "Console/Link Providers/Structured",
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
  render: () => <StructuredLinkProviderExample />,
  play: async ({ canvasElement }) => {
    const sourceLink = canvasElement.querySelector<HTMLButtonElement>(
      "button.console-link-button",
    );

    if (!sourceLink) {
      throw new Error("Expected a structured source-location provider link.");
    }

    sourceLink.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const result = canvasElement.querySelector(
      "[data-console-link-provider-result] strong",
    );

    if (!result?.textContent?.includes(".tsx:")) {
      throw new Error("Expected the structured provider action to run.");
    }
  },
};
