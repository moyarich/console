import { Console, useConsoleMessages } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

const method = "clear" as const;
const description =
  "Clear the seeded output through console.clear. Restore it to try again.";
const expected = "No console output yet.";

function runExample(console: globalThis.Console) {
  console.clear();
}

function ConsoleMethodStory() {
  const { messages, console, clear } = useConsoleMessages({
    source: `storybook-console-${method}`,
    initialMessages: [{ method: "log", data: ["Output to clear"], depth: 0 }],
  });

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 960, margin: "0 auto" }}>
      <p style={{ margin: 0 }}>{description}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => runExample(console)}>
          Run console.{method}
        </button>
        <button type="button" onClick={() => console.log("Output to clear")}>
          Restore output
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

export const Clear: Story = {
  name: "console.clear",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Run console.clear",
      }),
    );
    await expect(canvasElement).toHaveTextContent(expected);
    await expect(canvasElement).not.toHaveTextContent("Output to clear");
  },
};
