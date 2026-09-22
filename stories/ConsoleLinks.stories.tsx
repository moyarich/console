import type { Meta, StoryObj } from "@storybook/react-vite";
import LinkProvidersExample from "../apps/playground/src/examples/50-additional-usage/14-link-providers/example";

const meta = {
  title: "Console/Link Providers",
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

export const StructuredAndAnsi: Story = {
  render: () => <LinkProvidersExample />,
  play: async ({ canvasElement }) => {
    const consoles = canvasElement.querySelectorAll(".console-panel");

    if (consoles.length !== 2) {
      throw new Error("Expected structured and ANSI console examples.");
    }

    const ansiConsole = canvasElement.querySelector(
      '[data-console-mode="ansi"]',
    );

    if (!ansiConsole) {
      throw new Error("Expected the ANSI link-provider console.");
    }

    const webLink = ansiConsole.querySelector(
      'a.console-link[href="https://github.com/moyarich/console"]',
    );

    if (!webLink) {
      throw new Error("Expected the ANSI HTTP/HTTPS link to be interactive.");
    }

    const sourceLink = ansiConsole.querySelector<HTMLButtonElement>(
      "button.console-link-button",
    );

    if (
      !sourceLink ||
      sourceLink.textContent !==
        "packages/console/src/components/ConsoleStdout.tsx:1"
    ) {
      throw new Error("Expected the ANSI source-location provider link.");
    }

    sourceLink.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const result = canvasElement.querySelector(
      "[data-ansi-link-provider-result] strong",
    );

    if (
      result?.textContent?.trim() !==
      "packages/console/src/components/ConsoleStdout.tsx:1"
    ) {
      throw new Error("Expected the custom ANSI provider action to run.");
    }
  },
};
