import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";

const longLine = `Build output: ${"packages/console/src/components/Console.tsx ".repeat(12)}`;
const messages: ConsoleMessageData[] = [
  {
    id: "long-line",
    method: "log",
    depth: 0,
    data: [longLine, { command: longLine, status: "complete" }],
  },
];

function OutputOverflowExample() {
  const [outputOverflow, setOutputOverflow] = useState<"wrap" | "scroll">(
    "wrap",
  );
  const [terminal, setTerminal] = useState(false);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 600 }}>
      <label>
        Long lines{" "}
        <select
          value={outputOverflow}
          onChange={(event) =>
            setOutputOverflow(event.target.value as "wrap" | "scroll")
          }
        >
          <option value="wrap">Wrap</option>
          <option value="scroll">Horizontal scroll</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={terminal}
          onChange={(event) => setTerminal(event.target.checked)}
        />
        Terminal output
      </label>
      <p>Both modes preserve the complete output, including object previews.</p>
      {terminal ? (
        <Console
          mode="terminal"
          messages={[longLine]}
          outputOverflow={outputOverflow}
          style={{ width: "100%", height: 360 }}
        />
      ) : (
        <Console
          messages={messages}
          outputOverflow={outputOverflow}
          style={{ width: "100%", height: 360 }}
        />
      )}
    </div>
  );
}
const meta = {
  title: "Console/Messages",
  component: OutputOverflowExample,
} satisfies Meta<typeof OutputOverflowExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OutputOverflow: Story = {};
