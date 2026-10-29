import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Console } from "@moyarich/console";
import { createConsoleProcessStateAddon } from "@moyarich/console-addon-process-state";
import { createConsoleXtermAddon } from "@moyarich/console-addon-xterm";

const messages = [
  "\u001b]9;4;1;65\u0007\u001b[32mBuild started\u001b[0m\r\n",
  "Compiling packages...\r\n",
  "\u001b[33mWaiting for the next task\u001b[0m\r\n",
];

function TerminalAddonsExample() {
  const addons = useMemo(
    () => [
      createConsoleXtermAddon(),
      createConsoleProcessStateAddon({ indicator: true }),
    ],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Terminal addons</h1>
      <p>
        The xterm renderer displays ANSI output while process state reads
        terminal controls and displays build progress.
      </p>
      <section aria-label="Addons used">
        <h2>Addons used</h2>
        <ul>
          {addons.map((addon) => (
            <li key={addon.id}>
              <code title={addon.id}>
                {addon.id.replace("@moyarich/console-addon-", "")}
              </code>
            </li>
          ))}
        </ul>
      </section>
      <Console
        title="Terminal"
        mode="terminal"
        messages={messages}
        addons={addons}
        style={{ width: "100%", height: 320 }}
      />
    </div>
  );
}

const meta = {
  title: "Addons/All addons",
  component: TerminalAddonsExample,
} satisfies Meta<typeof TerminalAddonsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Terminal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "65",
    );
  },
};
