import { Console, useConsoleMessages } from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

const method = "table" as const;
const description = "Compare records in a table using selected columns.";
const expected = "healthy";

function runExample(console: globalThis.Console) {
  console.table(
    [
      { name: "API", status: "healthy", port: 3000 },
      { name: "Worker", status: "idle", port: 3001 },
    ],
    ["name", "status"],
  );
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

export const Table: Story = {
  name: "console.table",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Run console.table",
      }),
    );
    await expect(canvasElement).toHaveTextContent(expected);
  },
};
