import { Console, useConsoleMessages } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

const method = "assert" as const;
const description =
  "Only failed assertions produce output; the passing assertion stays silent.";
const expected = "Expected an authenticated user";

function runExample(console: globalThis.Console) {
  console.assert(true, "Passing assertion should stay silent");
  console.assert(false, "Expected an authenticated user", {
    authenticated: false,
  });
}

function ConsoleMethodStory() {
  const { messages, console, clear } = useConsoleMessages({
    source: `storybook-console-${method}`,
    initialMessages: [],
  });

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 960, margin: "0 auto" }}>
      <p style={{ margin: 0 }}>{description}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => runExample(console)}>
          Run console.{method}
        </button>
      </div>
      <Console
        title={`console.${method}`}
        messages={messages}
        onClear={clear}
      />
    </div>
  );
}

const meta = {
  title: "Console/Console methods",
  component: ConsoleMethodStory,
} satisfies Meta<typeof ConsoleMethodStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assert: Story = {
  name: "console.assert",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Run console.assert",
      }),
    );
    await expect(canvasElement).toHaveTextContent(expected);
    await expect(canvasElement).not.toHaveTextContent(
      "Passing assertion should stay silent",
    );
  },
};
